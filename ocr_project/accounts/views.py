from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.encoding import iri_to_uri
from urllib.parse import urlencode
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer,MedicalReportSerializer
from .models import CustomUser,MedicalReport, SentReport,SentSymptomReport,DoctorRating
from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .utils.speciality_mapping import DISEASE_SPECIALITY_MAP
from django.http import FileResponse, Http404
import os
from django.http import JsonResponse
from itertools import chain
from django.db.models import Q 
from django.db.models import Avg, Count
from django.db.models.functions import TruncMonth
from django.utils.timezone import now
from datetime import timedelta



def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def get_user_data(user: CustomUser):
    return {
        'id': str(user.id),
        'name': user.username,
        'email': user.email,
        'age': user.age,
        'gender': user.gender,
        'phone': user.phone,
        'role': user.role,  # ✅ Add this
        'specialization': user.speciality or 'N/A', 
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(request.data)
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens(user)
            user_data = get_user_data(user)
            return Response({
                'token': tokens,
                'user': user_data
            }, status=status.HTTP_201_CREATED)
            
        print(serializer.errors)

         
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            tokens = get_tokens(user)
            user_data = get_user_data(user)
            return Response({
                'token': tokens,
                'user': user_data
            }, status=status.HTTP_200_OK)
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class MedicalReportViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Handle file uploads

    def get_queryset(self):
        return MedicalReport.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DoctorDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        # Reports reviewed by this doctor
        reviewed_reports = list(chain(
            MedicalReport.objects.filter(reviewed_by=doctor, reviewed=True),
            SentSymptomReport.objects.filter(reviewed_by=doctor, reviewed=True)
        ))
        num_reviews = len(reviewed_reports)

        # Unique patients handled
        unique_patients = len({
            getattr(report, "user", None) or getattr(report, "patient_name", None)
            for report in reviewed_reports
        })

        # Average rating
        from .models import DoctorRating
        average_rating = DoctorRating.objects.filter(doctor=doctor).aggregate(
            avg=Avg('stars')
        )['avg'] or 0

        # Rank logic
        if average_rating >= 4.5 and unique_patients >= 50:
            rank = "Gold"
        elif average_rating >= 4 and unique_patients >= 20:
            rank = "Silver"
        elif average_rating >= 3.5 and unique_patients >= 10:
            rank = "Bronze"
        else:
            rank = "Unranked"

        # Accuracy trend: average stars per month (last 6 months)
        trend = (
            DoctorRating.objects.filter(doctor=doctor, created_at__gte=now() - timedelta(days=180))
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(avg_stars=Avg('stars'))
            .order_by('month')
        )
        accuracyTrend = [
            {"month": t['month'].strftime('%b %Y'), "avgStars": round(t['avg_stars'], 2)}
            for t in trend
        ]

        # Badges (optional)
        badges = []
        if num_reviews >= 10:
            badges.append("Bronze Reviewer")
        if num_reviews >= 25:
            badges.append("Silver Reviewer")
        if num_reviews >= 50:
            badges.append("Gold Reviewer")

        return Response({
            "name": doctor.username,
            "email": doctor.email,
            "specialization": doctor.speciality or "N/A",
            "patientsHandled": unique_patients,
            "feedbackCount": num_reviews,
            "averageRating": round(average_rating, 2),
            "rank": rank,
            "badges": badges,
            "accuracyTrend": accuracyTrend
        })

class PendingReviewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        sent_reports = SentReport.objects.filter(doctor=doctor)
        pending_reviews = []

        for sent in sent_reports:
            try:
                report = MedicalReport.objects.get(file=sent.report_file, reviewed=False)
                pending_reviews.append({
                    "id": report.id,
                    "patient_name": sent.patient_name,
                    "report_name": report.name,
                    "type": report.type,
                    "uploaded": report.upload_date,
                    "ai_analysis": sent.ai_analysis,
                    "age": sent.patient_age,
                    "gender": sent.patient_gender,
                    "report_file_url": sent.report_file.url if sent.report_file else None
                })
            except MedicalReport.DoesNotExist:
                continue

        return Response(pending_reviews)
class ReviewReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        from .models import MedicalReport, SentReport

        try:
            report = MedicalReport.objects.get(id=report_id)
        except MedicalReport.DoesNotExist:
            return Response({"error": "Report not found"}, status=404)

        # Check if this report was sent to this doctor
        if not SentReport.objects.filter(doctor=doctor, report_file=report.file).exists():
            return Response({"error": "You are not authorized to review this report."}, status=403)

        verdict = request.data.get('verdict')
        remarks = request.data.get('remarks')

        report.reviewed = True
        report.reviewed_by = doctor
        report.doctor_verdict = verdict
        report.doctor_remarks = remarks
        report.save()

        return Response({"message": "Report reviewed successfully"})

    
# accounts/views.py


class SuggestDoctorByDiseaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Received data:", request.data)
        disease = request.data.get("disease")
        print("Disease received:", disease)
        if not disease:
            return Response({"error": "Disease is required."}, status=400)

        speciality = DISEASE_SPECIALITY_MAP.get(disease.lower())
        if not speciality:
            return Response({"error": "Speciality not found for this disease."}, status=404)

        doctors = CustomUser.objects.filter(role='doctor', speciality__iexact=speciality).values(
            'id', 'username', 'email', 'speciality')[:3]

        return Response({
            "disease": disease,
            "suggested_speciality": speciality,
            "doctors": list(doctors)
        })
from .serializers import SentReportSerializer


class SendReportToDoctorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        doctor_id = request.data.get('doctor_id')
        patient_name = request.data.get('patient_name')
        patient_age = request.data.get('patient_age')
        patient_gender = request.data.get('patient_gender')
        ai_analysis = request.data.get('ai_analysis')
        report_file = request.FILES.get('report_file')

        # Validate doctor
        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            return Response({"error": "Doctor not found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Create MedicalReport (reviewed=False by default)
        medical_report = MedicalReport.objects.create(
            user=request.user,
            name=f"{patient_name}'s Report",
            type="Uploaded",
            file=report_file,
            extracted_text="",  # You can extract text later
            analysis=ai_analysis,
            reviewed=False
        )

        # 2. Create SentReport linked to the doctor
        sent_report = SentReport.objects.create(
            doctor=doctor,
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            report_file=medical_report.file,
            ai_analysis=ai_analysis,
        )

        serializer = SentReportSerializer(sent_report)
        return Response(
            {
                "success": True,
                "message": "Report sent successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )
class DoctorReportDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        try:
            report = MedicalReport.objects.get(id=report_id)
            sent = SentReport.objects.get(doctor=doctor, report_file=report.file)
            print(sent.report_file) 
        except (MedicalReport.DoesNotExist, SentReport.DoesNotExist):
            return Response({"error": "Report not found or not authorized"}, status=404)

        file_url = None
        if sent.report_file:
            # Build direct download URL with ?download=1
            file_url = iri_to_uri(
                request.build_absolute_uri(sent.report_file.url) + "?download=1"
            )

        return Response({
            "id": report.id,
            "patient_name": sent.patient_name,
            "patient_age": sent.patient_age,
            "patient_gender": sent.patient_gender,
            "analysis": report.analysis,
            "uploaded": report.upload_date,
            "ai_analysis": sent.ai_analysis,
            "report_file_download_url": file_url
        })
class DownloadReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        doctor = request.user
        try:
            report = MedicalReport.objects.get(id=report_id)
            sent = SentReport.objects.get(doctor=doctor, report_file=report.file)
        except (MedicalReport.DoesNotExist, SentReport.DoesNotExist):
            raise Http404("Report not found or not authorized")

        if not sent.report_file:
            raise Http404("File not available")

        file_path = sent.report_file.path
        if not os.path.exists(file_path):
            raise Http404("File not found on server")

        # Force download
        response = FileResponse(open(file_path, 'rb'), as_attachment=True)
        return response
    
def get_stats(request):
    patients_count = CustomUser.objects.filter(role='patient').count()
    doctors_count = CustomUser.objects.filter(role='doctor').count()

    data = {
        "patients": patients_count,
        "doctors": doctors_count,
    }
    return JsonResponse(data)

class SendSymptomReportToDoctorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        doctor_id = request.data.get('doctor_id')
        patient_name = request.data.get('patient_name')
        patient_age = request.data.get('patient_age')
        patient_gender = request.data.get('patient_gender')
        symptoms = request.data.get('symptoms')
        ai_analysis = request.data.get('ai_analysis')

        try:
            doctor = CustomUser.objects.get(id=doctor_id, role='doctor')
        except CustomUser.DoesNotExist:
            return Response({"error": "Doctor not found."}, status=status.HTTP_404_NOT_FOUND)

        # Create a MedicalReport for symptom-based cases
        medical_report = MedicalReport.objects.create(
            user=request.user,
            name=f"{patient_name}'s Symptom Report",
            type="Symptom-based",
            file=None,  # No file, only AI analysis
            extracted_text=symptoms,
            analysis=ai_analysis,
            reviewed=False
        )

        # Create SentSymptomReport linked to the doctor
        sent_report = SentSymptomReport.objects.create(
            doctor=doctor,
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            symptoms=symptoms,
            ai_analysis=ai_analysis
        )

        return Response({
            "success": True,
            "message": "Symptom report sent successfully",
            "id": sent_report.id
        }, status=status.HTTP_201_CREATED)


class PendingSymptomReviewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        pending = SentSymptomReport.objects.filter(doctor=doctor, reviewed=False)
        data = [{
            "id": report.id,
            "patient_name": report.patient_name,
            "age": report.patient_age,
            "gender": report.patient_gender,
            "symptoms": report.symptoms,
            "ai_analysis": report.ai_analysis,
            "sent_at": report.sent_at,
        } for report in pending]

        return Response(data)

class ReviewSymptomReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        try:
            report = SentSymptomReport.objects.get(id=report_id, doctor=doctor)
        except SentSymptomReport.DoesNotExist:
            return Response({"error": "Report not found"}, status=404)

        report.reviewed = True
        report.reviewed_by = doctor
        report.doctor_verdict = request.data.get('verdict')
        report.doctor_remarks = request.data.get('remarks')
        report.save()

        # --- Create Vault entry ---
        patient = CustomUser.objects.filter(
            Q(username__iexact=report.patient_name) | Q(email__iexact=report.patient_name)
        ).first()

        if patient:
            VaultReviewNew.objects.create(
                doctor=request.user,
                patient=patient,
                report_id=report.id,
                source='symptom-based',
                accepted=request.data.get('verdict') in [True, 'true', 'True', 1, '1'],
                remarks=request.data.get('remarks')
            )

        return Response({"message": "Symptom report reviewed and stored in vault"})

from rest_framework.exceptions import ValidationError
from .serializers import VaultReviewSerializer
from .models import VaultReviewNew

class VaultReviewCreateView(generics.CreateAPIView):
    queryset = VaultReviewNew.objects.all()
    serializer_class = VaultReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        report_id = self.request.data.get('reportId')
        source = self.request.data.get('source')

        if not report_id or not source:
            raise ValidationError("Both reportId and source are required.")

        if source == 'medical-report':
            from ocr_app.models import MedicalReport
            report = MedicalReport.objects.get(id=report_id)
            patient = report.user  # always a CustomUser

        elif source == 'symptom-based':
            from accounts.models import SentSymptomReport, CustomUser
            report = SentSymptomReport.objects.get(id=report_id)

            # SentSymptomReport has no user FK, match by patient_name
            patient = CustomUser.objects.filter(Q(username__iexact=report.patient_name) | Q(email__iexact=report.patient_name)).first()


            if not patient:
                raise ValidationError(
                    f"No matching patient found for symptom report '{report.patient_name}'."
                )

        else:
            raise ValidationError("Invalid source type.")

        serializer.save(
            doctor=self.request.user,
            patient=patient,
            report_id=report_id,
            source=source
        )
class VaultReviewListView(generics.ListAPIView):
    serializer_class = VaultReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return VaultReviewNew.objects.filter(
            Q(patient=user) | Q(doctor=user)
        ).select_related('doctor', 'patient')
    
class SymptomReportDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        doctor = request.user
        if doctor.role != 'doctor':
            return Response({"error": "Access denied"}, status=403)

        try:
            report = SentSymptomReport.objects.get(id=report_id, doctor=doctor)
        except SentSymptomReport.DoesNotExist:
            return Response({"error": "Symptom report not found or not authorized"}, status=404)

        return Response({
            "id": report.id,
            "patient_name": report.patient_name,
            "patient_age": report.patient_age,
            "patient_gender": report.patient_gender,
            "symptoms": report.symptoms,
            "ai_analysis": report.ai_analysis,
            "sent_at": report.sent_at,
            "reviewed": report.reviewed,
            "doctor_verdict": report.doctor_verdict,
            "doctor_remarks": report.doctor_remarks
        })

class SubmitDoctorRatingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        doctor_id = request.data.get("doctor_id")
        doctor_name = request.data.get("doctor_name")
        stars = int(request.data.get("stars", 0))

        if stars < 1 or stars > 5:
            return Response({"error": "Stars must be between 1 and 5."}, status=400)

        doctor = None
        if doctor_id:
            doctor = CustomUser.objects.filter(id=doctor_id, role="doctor").first()
        elif doctor_name:
            doctor = CustomUser.objects.filter(username=doctor_name, role="doctor").first()

        if not doctor:
            return Response({"error": "Doctor not found."}, status=404)

        DoctorRating.objects.create(
            doctor=doctor,
            patient=request.user,
            stars=stars
        )

        return Response({"message": "Rating submitted successfully"})

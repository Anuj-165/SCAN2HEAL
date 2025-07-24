from django.urls import path, include
from .views import RegisterView, LoginView, CurrentUserView, LogoutView, MedicalReportViewSet, DoctorDashboardAPIView, PendingReviewsAPIView, ReviewReportAPIView,SuggestDoctorByDiseaseAPIView
from rest_framework.routers import DefaultRouter
from .views import SendReportToDoctorView
from .views import DoctorReportDetailAPIView,get_stats,SendSymptomReportToDoctorView,PendingSymptomReviewsAPIView,ReviewSymptomReportAPIView
from .views import VaultReviewCreateView, VaultReviewListView,SymptomReportDetailAPIView, SubmitDoctorRatingAPIView

from rest_framework_simplejwt.views import TokenRefreshView  # <-- add this


router = DefaultRouter()
router.register(r'reports', MedicalReportViewSet, basename='reports')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('logout/', LogoutView.as_view(), name='logout'),

    path('doctor/dashboard/', DoctorDashboardAPIView.as_view()),
    path('doctor/pending-reports/', PendingReviewsAPIView.as_view()),
    path('doctor/review-report/<int:report_id>/', ReviewReportAPIView.as_view()),
    path('patient/suggest-doctors-by-disease/', SuggestDoctorByDiseaseAPIView.as_view()),
    path('send-report/', SendReportToDoctorView.as_view(), name='send-report'),
    path('doctor/report-detail/<int:report_id>/', DoctorReportDetailAPIView.as_view()),
    path('get-stats/', get_stats, name='get-stats'),
    path('send-symptom-report/', SendSymptomReportToDoctorView.as_view(), name='send-symptom-report'),
    path('doctor/pending-symptom-reports/', PendingSymptomReviewsAPIView.as_view(), name='pending-symptom-reports'),
    path('doctor/review-symptom-report/<int:report_id>/', ReviewSymptomReportAPIView.as_view(), name='review-symptom-report'),
    path('vault/store-review/', VaultReviewCreateView.as_view(), name='store-vault-review'),
    path('vault/reviews/', VaultReviewListView.as_view(), name='vault-reviews'),
    path('doctor/symptom-report-detail/<int:report_id>/', SymptomReportDetailAPIView.as_view(), name='symptom-report-detail'),
    path('doctor/rate/', SubmitDoctorRatingAPIView.as_view(), name='submit-doctor-rating'),
    
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),


    path('', include(router.urls)),
]

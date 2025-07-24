from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, MedicalReport, SentReport, VaultReviewNew


class RegisterSerializer(serializers.ModelSerializer):
    # ✅ name from frontend will be stored in username field
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('doctor', 'Doctor'), ('patient', 'Patient')])
    speciality = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password', 'age', 'gender', 'phone', 'role', 'speciality']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        user = authenticate(email=email, password=password)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'age', 'gender', 'phone', 'role', 'speciality']


class MedicalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReport
        fields = '__all__'
        read_only_fields = ['user', 'upload_date']
        
from .models import SentReport

class SentReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentReport
        fields = '__all__'
        read_only_fields = ['sent_at']

from rest_framework import serializers
from accounts.models import VaultReviewNew

class VaultReviewSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)
    patient_name = serializers.CharField(source='patient.username', read_only=True)

    class Meta:
        model = VaultReviewNew
        fields = ['id', 'report_id', 'source', 'doctor_name', 'patient_name', 'accepted', 'remarks', 'timestamp']

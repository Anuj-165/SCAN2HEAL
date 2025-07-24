from django.db import models

# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        null=True,
        blank=True
    )
    phone = models.CharField(max_length=15, null=True, blank=True)

    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')

    # Only used if role == doctor
    speciality = models.CharField(max_length=100, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # Still needed for superuser

    def __str__(self):
        return f"{self.email} ({self.role})"




from django.db import models
from django.conf import settings  # ✅ Import the correct User model

from django.conf import settings

class MedicalReport(models.Model):
    REPORT_TYPES = [
        ('Lab Report', 'Lab Report'),
        ('Radiology', 'Radiology'),
        ('Prescription', 'Prescription'),
        ('Cardiac', 'Cardiac'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=REPORT_TYPES)
    file = models.FileField(upload_to='reports/')
    upload_date = models.DateField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)
    analysis = models.TextField(blank=True)

    # ✅ New fields for doctor review
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctor_reviews"
    )
    doctor_verdict = models.BooleanField(null=True, blank=True)
    doctor_remarks = models.TextField(blank=True)

    def __str__(self):
        return self.name

class SentReport(models.Model):
    doctor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_reports')  # Assuming doctor is a User
    patient_name = models.CharField(max_length=100)
    patient_age = models.IntegerField()
    patient_gender = models.CharField(max_length=10)
    report_file = models.FileField(upload_to='sent_reports/')
    ai_analysis = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} → Dr.{self.doctor.username}"
    
class SentSymptomReport(models.Model):
    doctor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_symptom_reports')
    patient_name = models.CharField(max_length=100)
    patient_age = models.IntegerField()
    patient_gender = models.CharField(max_length=10)
    symptoms = models.TextField()  # Patient-entered symptoms
    ai_analysis = models.TextField()
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="symptom_reviews"
    )
    doctor_verdict = models.BooleanField(null=True, blank=True)
    doctor_remarks = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} (Symptoms) → Dr.{self.doctor.username}"

class VaultReviewNew(models.Model):
    SOURCE_CHOICES = [
        ('symptom-based', 'Symptom Based'),
        ('medical-report', 'Medical Report'),
    ]

    report_id = models.IntegerField()
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vault_reviews'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_vault_reviews'
    )
    accepted = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VaultReviewNew {self.id} for Report {self.report_id}"

# models.py
class DoctorRating(models.Model):
    doctor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="ratings")
    patient = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    stars = models.PositiveIntegerField()  # 1 to 5
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('doctor', 'patient', 'created_at')  # one rating per review


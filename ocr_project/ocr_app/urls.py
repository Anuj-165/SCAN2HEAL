from django.urls import path
from . import views
from .views import SymptomListView


urlpatterns = [
    path('api/report/ocr/', views.handle_ocr),
    path('api/report/symptoms/', views.handle_symptoms),
    path('api/report/clarify/', views.handle_clarification),
    path('api/medicine/side-effects/', views.handle_side_effects),
    path('api/report/pdf/', views.download_pdf),
    path('api/report/save/', views.handle_save_report),
    path('api/symptoms/list/', SymptomListView.as_view(), name='symptom-list'),
    
]

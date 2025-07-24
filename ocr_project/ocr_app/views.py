# views.py
import matplotlib
matplotlib.use('Agg') 
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

import os, re, json
import pandas as pd
import numpy as np
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import Symptom, Medicine, Disease
from pdf2image import convert_from_bytes
from pytesseract import image_to_string
from sklearn.linear_model import LogisticRegression
from django.http import HttpResponse, FileResponse, JsonResponse
from accounts.models import SentSymptomReport

from sklearn.preprocessing import LabelEncoder
from PIL import Image
import difflib
import requests
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from django.http import FileResponse
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import matplotlib.pyplot as plt
from reportlab.lib.utils import ImageReader
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken


font_path = os.path.join(os.path.dirname(__file__), 'NotoSansDevanagari-Regular.ttf')

# ✅ Register the font with ReportLab
pdfmetrics.registerFont(TTFont('NotoHindi', font_path))

def draw_chart(matched_parameters):
    labels = list(matched_parameters.keys())[:5]  # limit chart for space
    values = [float(matched_parameters[k]) for k in labels]

    plt.figure(figsize=(6, 3))
    plt.barh(labels, values, color='teal')
    plt.title("Extracted Parameter Values")
    plt.tight_layout()

    chart_buffer = BytesIO()
    plt.savefig(chart_buffer, format='PNG')
    chart_buffer.seek(0)
    plt.close()
    return chart_buffer


# Add this after importing os
POPPLER_PATH = r"C:\Users\ayush\Downloads\poppler-24.08.0\Library\bin"
os.environ["PATH"] += os.pathsep + POPPLER_PATH

# ======== Load Models =========
def load_model(path, target_column):
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), path)).dropna()

    # Normalize string target values
    if df[target_column].dtype == 'object':
        df[target_column] = df[target_column].map({'ckd': 1, 'notckd': 0})

    # Normalize 2 → 0 if binary target column has values like 1/2
    unique_vals = df[target_column].dropna().unique()
    if sorted(unique_vals.tolist()) == [1, 2]:
        df[target_column] = df[target_column].map({1: 1, 2: 0})

    # Encode input features
    for col in df.columns:
        if df[col].dtype == 'object' and col != target_column:
            df[col] = LabelEncoder().fit_transform(df[col])

    X = df.drop(columns=[target_column])
    y = df[target_column]

    model = LogisticRegression(max_iter=10000, solver="liblinear", class_weight="balanced")
    model.fit(X, y)
    return model, X.columns.tolist()


models = {
    "diabetes": load_model("diabetes.csv", "Outcome"),
    "heart": load_model("heart.csv", "target"),
    "liver": load_model("indian_liver_patient.csv", "Dataset"),
    "kidney": load_model("kidney_disease.csv", "classification"),
    "dengue": load_model("Dengue diseases dataset.csv", "Final Output")
}

def extract_text_from_any_file(file):
    name = file.name.lower()

    if name.endswith(".pdf"):
        images = convert_from_bytes(file.read())
    elif name.endswith((".jpg", ".jpeg", ".png", ".bmp")):
        images = [Image.open(file)]
    elif name.endswith(".txt"):
        return file.read().decode("utf-8")
    else:
        raise ValueError("Unsupported file format.")

    full_text = "\n".join(image_to_string(img) for img in images)
    return full_text

import re
from datetime import datetime

def check_report_status(text, disease):
    synonym_thresholds = {
        "diabetes": {
            "FBS": {
                "aliases": ["FBS", "Fasting Blood Sugar", "Fasting Glucose", "GLUCOSE, FASTING", "Glucose Fasting"],
                "ranges": {
                    "ok": (0, 99),
                    "prediabetes": (100, 125),
                    "abnormal": (126, float("inf"))
                }
            },
            "HbA1c": {
                "aliases": ["HbA1c", "A1C", "Glycated Hemoglobin", "GLYCOSYLATED HEMOGLOBIN"],
                "ranges": {
                    "ok": (0, 5.6),
                    "prediabetes": (5.7, 6.4),
                    "abnormal": (6.5, float("inf"))
                }
            },
            "Glucose": {
                "aliases": ["Glucose", "RBS", "Random Blood Sugar", "Blood Sugar"],
                "ranges": {
                    "ok": (0, 99),
                    "prediabetes": (100, 125),
                    "abnormal": (126, float("inf"))
                }
            }
        },
        "kidney": {
            "Creatinine": {"aliases": ["Creatinine", "Serum Creatinine"], "max": 1.3},
            "Urea": {"aliases": ["Urea", "Blood Urea"], "max": 43},
            "Sodium": {"aliases": ["Sodium", "Na+"], "min": 135, "max": 145},
            "Potassium": {"aliases": ["Potassium", "K+"], "max": 5.0}
        },
        "liver": {
            "Total Bilirubin": {"aliases": ["Total Bilirubin", "Bilirubin Total"], "max": 1.2},
            "Direct Bilirubin": {"aliases": ["Direct Bilirubin", "Bilirubin Direct"], "max": 0.2},
            "AST": {"aliases": ["AST", "SGOT"], "max": 35},
            "ALT": {"aliases": ["ALT", "SGPT"], "max": 45},
            "Alkaline Phosphatase": {"aliases": ["Alkaline Phosphatase", "ALP"], "min": 40, "max": 129}
        },
        "heart": {
            "EF": {"aliases": ["EF", "Ejection Fraction"], "min": 55},
            "PASP": {"aliases": ["PASP"], "max": 35},
            "Peak TR Velocity": {"aliases": ["Peak TR Velocity"], "max": 2.8}
        },
        "dengue": {
            "WBC": {"aliases": ["WBC", "WBC Count"], "min": 4000, "max": 11000},
            "Platelets": {"aliases": ["Platelet Count", "Platelets"], "min": 150000},
            "IgM": {"aliases": ["IgM", "DENGUE FEVER ANTIBODY, IgM"], "min": 1.1},
            "IgG": {"aliases": ["IgG", "DENGUE FEVER ANTIBODY, IgG"], "min": 2.2}
        }
    }

    disease = disease.lower()
    check_map = synonym_thresholds.get(disease, {})
    results = {}

    for key, limits in check_map.items():
        aliases = limits.get("aliases", [key])
        found = False
        for label in aliases:
            match = re.search(rf"{label}.*?(-?\d+\.\d+)", text, re.IGNORECASE | re.DOTALL)
            if not match:
                match = re.search(rf"{label}.*?[^\d\-\.](-?\d+\.\d+)", text, re.IGNORECASE)
            if match:
                val = float(match.group(1))
                found = True

                if "ranges" in limits:
                    status = "unknown"
                    for label_status, (low, high) in limits["ranges"].items():
                        if low <= val <= high:
                            status = label_status
                            break
                else:
                    min_val = limits.get("min", float("-inf"))
                    max_val = limits.get("max", float("inf"))
                    if val < min_val or val > max_val:
                        status = "abnormal"
                    else:
                        status = "positive" if key in ["IgM", "IgG"] else "ok"

                results[key] = {
                    "value": val,
                    "status": status
                }
                break

        if not found:
            results[key] = {"value": None, "status": "missing"}

    # Conclusion
    abnormal = [k for k, v in results.items() if v["status"] in ["abnormal", "positive"]]
    missing = [k for k, v in results.items() if v["status"] == "missing"]

    if abnormal:
        status = "Positive"
    elif len(missing) == len(results):
        status = "Inconclusive"
    else:
        status = "Negative"

    # 🕒 Report Time
    report_time = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 💬 Recommendations and Treatments
    recommendation = "No recommendation available."
    possible_treatments = []

    if disease == "diabetes":
        hba1c_val = results.get("HbA1c", {}).get("value")
        if hba1c_val is not None:
            if hba1c_val >= 8.0:
                recommendation = "⚠️ HbA1c is critically high. Medicine and doctor consultation strongly recommended."
            elif hba1c_val >= 6.5:
                recommendation = "🟡 HbA1c indicates diabetes. Lifestyle changes and monitoring advised."
            elif hba1c_val >= 5.7:
                recommendation = "🟡 Prediabetic range. Maintain healthy habits and retest in 3 months."
            else:
                recommendation = "✅ HbA1c is normal. Continue your healthy lifestyle."

        possible_treatments = [
            "Lifestyle changes: diet, regular exercise, and weight control.",
            "Doctors may prescribe medications such as Metformin.",
            "Regular glucose and HbA1c monitoring is advised."
        ]

    elif disease == "dengue":
        platelets = results.get("Platelets", {}).get("value")
        if platelets is not None and platelets < 100000:
            recommendation = "⚠️ Low platelet count. Hospitalization may be required."
        else:
            recommendation = "🟡 Dengue infection detected. Monitor symptoms closely and stay hydrated."

        possible_treatments = [
            "Drink plenty of fluids and rest.",
            "Doctors may recommend paracetamol for fever.",
            "Avoid NSAIDs like ibuprofen due to bleeding risk.",
            "Monitor platelet count regularly."
        ]

    elif disease == "heart":
        ef = results.get("EF", {}).get("value")
        if ef is not None and ef < 55:
            recommendation = "⚠️ Low ejection fraction. Cardiologist consultation is highly recommended."
        else:
            recommendation = "🟡 Monitor heart function and consult a doctor for detailed evaluation."

        possible_treatments = [
            "Cardiologist may suggest lifestyle changes and stress management.",
            "Treatments may include beta blockers or ACE inhibitors.",
            "Further tests like ECG or Echo may be required."
        ]

    elif disease == "kidney":
        creat = results.get("Creatinine", {}).get("value")
        if creat and creat > 1.3:
            recommendation = "⚠️ Elevated creatinine level. Possible kidney dysfunction. Doctor visit advised."
        else:
            recommendation = "🟢 Kidney parameters appear within normal limits."

        possible_treatments = [
            "Maintain hydration and monitor blood pressure.",
            "Limit salt and protein intake if advised.",
            "Consult nephrologist for abnormal creatinine or urea."
        ]

    elif disease == "liver":
        tb = results.get("Total Bilirubin", {}).get("value")
        if tb and tb > 1.2:
            recommendation = "⚠️ Elevated bilirubin. Possible liver dysfunction. Consultation recommended."
        else:
            recommendation = "🟢 Liver parameters appear okay. Keep a healthy lifestyle."

        possible_treatments = [
            "Avoid alcohol and fatty foods.",
            "Monitor medications affecting liver.",
            "Follow up with LFT (Liver Function Tests) if needed."
        ]

    return {
        "status": status,
        "details": results,
        "recommendation": recommendation,
        "possible_treatments": possible_treatments,
        "report_time": report_time
    }




# ========== Core AI Functions ==========

def match_parameters(text, expected_cols, disease=None):
    synonym_map = {
        "diabetes": {
            "Pregnancies": ["Pregnancies"],
            "Glucose": ["Glucose", "RBS", "Random Blood Sugar", "Blood Sugar"],
            "BloodPressure": ["BloodPressure", "BP"],
            "SkinThickness": ["SkinThickness"],
            "Insulin": ["Insulin"],
            "BMI": ["BMI"],
            "DiabetesPedigreeFunction": ["DiabetesPedigreeFunction"],
            "Age": ["Age"],
            "FBS": ["FBS", "Fasting Blood Sugar", "Fasting Glucose", "GLUCOSE, FASTING", "Glucose Fasting"],
            "HbA1c": ["HbA1c", "Glycated Hemoglobin", "A1C"]
        },
        "kidney": {
            "age": ["Age"],
            "bp": ["BP", "Blood Pressure"],
            "sg": ["Specific Gravity", "SG"],
            "al": ["Albumin"],
            "su": ["Sugar"],
            "rbc": ["RBC"],
            "pc": ["Pus Cells"],
            "pcc": ["Pus Cell Clumps"],
            "ba": ["Bacteria"],
            "bgr": ["Blood Glucose Random", "BGR"],
            "bu": ["Blood Urea", "BU"],
            "sc": ["Serum Creatinine", "SC"],
            "sod": ["Sodium", "Na+"],
            "pot": ["Potassium", "K+"],
            "hemo": ["Hemoglobin", "HGB", "HB"],
            "pcv": ["Packed Cell Volume", "PCV"],
            "wc": ["WBC Count", "WC"],
            "rc": ["RBC Count", "RC"]
        },
        "liver": {
            "Age": ["Age"],
            "Gender": ["Sex", "Gender"],
            "Total_Bilirubin": ["Total Bilirubin", "Bilirubin Total", "SERUM BILIRUBIN (TOTAL)",""],
            "Direct_Bilirubin": ["Direct Bilirubin", "Bilirubin Direct", "SERUM BILIRUBIN (DIRECT)"],
            "Alkaline_Phosphotase": ["Alkaline Phosphatase", "ALK PHOS", "ALP"],
            "Alamine_Aminotransferase": ["ALT", "SGPT", "ALT (SGPT)"],
            "Aspartate_Aminotransferase": ["AST", "SGOT"],
            "Total_Protiens": ["Total Protein", "TP"],
            "Albumin": ["Albumin", "ALB"],
            "Albumin_and_Globulin_Ratio": ["A/G", "AG Ratio", "Albumin/Globulin Ratio","(A/G)Ratio"]
        },
        "dengue": {
            "WBC": ["WBC Count", "White Blood Cells"],
            "Platelets": ["Platelet Count", "Platelets"],
            "Hemoglobin": ["Hemoglobin", "Hb", "HGB"],
            "RBC": ["RBC Count", "RBC"],
            "HCT": ["Hematocrit", "HCT"],
            "NS1": ["NS1 Antigen"],
            "IgM": ["IgM", "DENGUE IgM"],
            "IgG": ["IgG", "DENGUE IgG"]
        }
    }

    matched = {}
    used_map = synonym_map.get(disease.lower(), {}) if disease else {}

    for col in expected_cols:
        synonyms = used_map.get(col, [col])
        found = False
        for label in synonyms:
            match = re.search(rf"{label}\s*[:\-]?\s*(\d+\.?\d*)", text, re.IGNORECASE)
            if match:
                try:
                    matched[col] = float(match.group(1))
                    found = True
                    break
                except:
                    continue
        if not found:
            matched[col] = 0

    return matched

    # Gender handling
    if 'Gender' in expected_cols and 'Gender' not in matched:
        gender_match = re.search(r"Sex\s*[:/]\s*(\w+)", text, re.IGNORECASE)
        if gender_match:
            g = gender_match.group(1).strip().lower()
            matched['Gender'] = 1 if g in ['m', 'male'] else 0

    # Age handling
    if 'Age' in expected_cols and matched.get('Age', 0) == 0:
        age_match = re.search(r"Age\s*[:/]\s*(\d+)", text, re.IGNORECASE)
        if age_match:
            matched['Age'] = int(age_match.group(1))

    return matched
def determine_severity(thresholds):
    abnormal_count = sum(1 for v in thresholds.values() if v["status"].lower() == "abnormal")

    if abnormal_count == 0:
        return "Low"
    elif abnormal_count == 2:
        return "Moderate"
    else:
        return "High"



def predict_disease(text):
    predictions = {}

    for disease, (model, cols) in models.items():
        input_data = match_parameters(text, cols, disease)
        values_df = pd.DataFrame([input_data], columns=cols)

        pred = model.predict(values_df)[0]

        # 👇 Evaluate threshold values for severity (from report text)
        threshold_result = check_report_status(text, disease)
        severity = determine_severity(threshold_result["details"])

        predictions[disease] = {
            "prediction": int(pred),
            "matched_parameters": input_data,
            "severity": severity,  # 👈 Add this line
            "threshold_status": threshold_result["status"],
            "threshold_details": threshold_result["details"]
        }

    return predictions



def get_disease_from_symptoms(symptoms):
    all_symptoms = Symptom.objects.values_list('name', flat=True)
    corrected = []
    for s in symptoms:
        best = difflib.get_close_matches(s, all_symptoms, n=1)
        if best:
            corrected.append(best[0])
    return corrected

def clarify_disease(symptom_list):
    qs = Symptom.objects.filter(name__in=symptom_list).prefetch_related('diseases')
    disease_symptom_map = {}

    for sym in qs:
        for d in sym.diseases.all():
            if d.name not in disease_symptom_map:
                disease_symptom_map[d.name] = set()
            disease_symptom_map[d.name].add(sym.name)

    sorted_dis = sorted(disease_symptom_map.items(), key=lambda x: -len(x[1]))

    if len(sorted_dis) > 1 and len(sorted_dis[0][1]) == len(sorted_dis[1][1]):
        top_diseases = sorted_dis[:2]
        all_symptoms = set()
        for _, syms in top_diseases:
            all_symptoms |= syms
        options = list(all_symptoms - set(symptom_list))[:3]  # suggest up to 3 new symptoms
        return sorted_dis, options

    return sorted_dis, []

def get_medicine_for_disease(disease_name):
    # Normalize input
    disease_name = disease_name.strip().lower()

    # Optional: map simplified AI/ML keys to actual DB entries
    DISEASE_MAPPING = {
        "diabetes": "Diabetes (Type 2)",
        "heart": "Heart attack",
        "kidney": "Chronic cholestasis",
        "liver": "Alcoholic hepatitis",
        "cold": "Common Cold",
        "flu": "Colds & Flu",
        "hypertension": "Hypertension",
        "hepatitis": "Hepatitis B",
        "cancer": "Cancer",
        "migraine": "Migraine",
        "pneumonia": "Pneumonia",
        "dengue": "Dengue",
        "aids": "AIDS/HIV",
        "allergy": "Allergy",
        "asthma": "Asthma",
        "thyroid": "Hypothyroidism",
        # ➕ Add more mappings as needed
    }

    # Use mapping if available
    mapped_name = DISEASE_MAPPING.get(disease_name, disease_name)

    # Search for disease in DB
    disease_qs = Disease.objects.filter(name__icontains=mapped_name)
    if disease_qs.exists():
        disease = disease_qs.first()
        meds = Medicine.objects.filter(disease=disease)[:5]
        return [{'name': med.name, 'link': med.link} for med in meds]

    return []



def fetch_side_effects(medicine_name):
    base_url = "https://api.fda.gov/drug/label.json"
    params = {
        "search": f"openfda.generic_name:{medicine_name}",
        "limit": 1
    }

    try:
        response = requests.get(base_url, params=params)
        data = response.json()

        # Try to get adverse reactions, if not found, get warnings
        if "results" in data and data["results"]:
            drug_data = data["results"][0]
            side_effects = drug_data.get("adverse_reactions", None)
            if not side_effects:
                side_effects = drug_data.get("warnings", ["No side effects found."])

            # Format into a list
            if isinstance(side_effects, list):
                return side_effects
            elif isinstance(side_effects, str):
                return [side_effects]

        return ["No side effects found."]
    
    except Exception as e:
        return [f"API error: {str(e)}"]

    
def analyze_report_text(text, disease):
    """
    Combines model prediction + threshold evaluation + treatment advice
    """
    predictions = predict_disease(text)
    if disease not in predictions:
        return {
            "severity": "Unknown",
            "matched_parameters": {},
            "threshold_status": "Inconclusive",
            "threshold_details": {},
            "recommendations": [],
            "medicines": [],
            "final_decision": "Diagnosis unavailable"
        }

    result = predictions[disease]
    thresholds = check_report_status(text, disease)
    meds = get_medicine_for_disease(disease)

    return {
        "severity": result.get("severity", "N/A"),
        "matched_parameters": result.get("matched_parameters", {}),
        "threshold_status": thresholds["status"],
        "threshold_details": thresholds["details"],
        "recommendations": thresholds["possible_treatments"],
        "medicines": meds,
        "final_decision": thresholds["recommendation"]
    }

    
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from django.http import FileResponse

def generate_diagnosis_pdf(disease_name, prediction_data, thresholds=None, medicines=None, show_threshold_only=False, final_decision=None):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "🩺 Scan2Heal - Diagnostic Report")
    y -= 40

    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"Disease: {disease_name}")
    y -= 20
    c.drawString(50, y, f"Final Decision: {final_decision}")
    y -= 30

    # Severity
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Severity:")
    y -= 20
    c.setFont("Helvetica", 12)
    c.drawString(60, y, prediction_data.get("severity", "N/A"))
    y -= 30

    # Threshold Status
    if not show_threshold_only:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Threshold Status:")
        y -= 20
        c.setFont("Helvetica", 12)
        c.drawString(60, y, prediction_data.get("threshold_status", "N/A"))
        y -= 20

    # Threshold Parameters
    threshold_data = prediction_data.get("threshold_details", {})
    if threshold_data:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Threshold Parameters:")
        y -= 20
        c.setFont("Helvetica", 12)
        for param, obj in threshold_data.items():
            val = obj.get("value", "None")
            status = obj.get("status", "unknown")
            c.drawString(60, y, f"{param}: {val} → {status}")
            y -= 15
        y -= 10

    # Recommendations
    recommendations = prediction_data.get("recommendations", [])
    if recommendations:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Recommendations:")
        y -= 20
        c.setFont("Helvetica", 12)
        for rec in recommendations:
            c.drawString(60, y, f"- {rec}")
            y -= 15
        y -= 10

    # Medicines
    if medicines:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Medicines:")
        y -= 20
        c.setFont("Helvetica", 12)
        for med in medicines:
            name = med.get("name", "Unnamed")
            link = med.get("link", "No Link")
            c.drawString(60, y, f"{name} - {link}")
            y -= 15

    c.save()
    buffer.seek(0)
    return buffer  # ✅ Return the full buffer, not .getvalue()




def download_report_pdf(request):
    if request.method == 'POST':
        disease = request.POST.get("disease", "Unknown Disease")
        ocr_text = request.POST.get("ocr_text", "")

        # Run prediction
        predictions = predict_disease(ocr_text)
        if disease not in predictions:
            return HttpResponse("Invalid disease", status=400)

        result = predictions[disease]  # contains matched_parameters, severity, etc.
        thresholds = check_report_status(ocr_text, disease)  # contains threshold_details

        # ✅ Inject matched parameter values into thresholds if available
        for key, val in result.get("matched_parameters", {}).items():
            if key in thresholds["details"]:
                thresholds["details"][key]["value"] = val
                # Optionally override "status" too (e.g., based on positive/abnormal match)
                if val and thresholds["details"][key]["status"] == "missing":
                    thresholds["details"][key]["status"] = "positive"

        # Add threshold_details to result before passing to PDF
        result["threshold_details"] = thresholds["details"]

        # Generate PDF
        pdf_buffer = generate_diagnosis_pdf(
            disease_name=disease,
            prediction_data=result,
            thresholds=thresholds["details"],
            medicines=get_medicine_for_disease(disease),
            final_decision=thresholds["status"]
        )

        return HttpResponse(
            pdf_buffer,
            content_type='application/pdf',
            headers={
                'Content-Disposition': 'attachment; filename="report.pdf"'
            }
        )

    return HttpResponse("Method not allowed", status=405)


@csrf_exempt
@csrf_exempt
@csrf_exempt
def handle_ocr(request):
    if request.method == 'POST':
        file = request.FILES.get('health_file')
        disease_key = request.POST.get('target_disease', '').lower()

        if not file or not disease_key:
            return JsonResponse({'error': 'Missing file or disease name'}, status=400)

        text = extract_text_from_any_file(file)
        all_results = predict_disease(text)

        if disease_key in all_results:
            result = all_results[disease_key]
            threshold = check_report_status(text, disease_key)
            meds = get_medicine_for_disease(disease_key)

            # ✅ FILTER matched only (non-None values)
            filtered_thresholds = {
                k: v for k, v in threshold["details"].items()
                if v.get("value") is not None
            }

            return JsonResponse({
                "threshold_status": threshold["status"],
                "matched_parameters": {
                    k: v["value"] for k, v in filtered_thresholds.items()
                    if v["status"] in ["positive", "abnormal"]
                },
                "severity": result["severity"],
                "final_decision": threshold["recommendation"],
                "recommendations": threshold["possible_treatments"],
                "medicines": meds
            })

        return JsonResponse({"error": "No result for selected disease"}, status=404)

    return JsonResponse({"error": "Invalid method"}, status=405)


@csrf_exempt
@csrf_exempt
def handle_symptoms(request):
    if request.method == 'POST':
        raw = request.POST.get('symptoms', '')
        name = request.POST.get('patient_name', 'Unknown')
        age = int(request.POST.get('patient_age', 0))
        gender = request.POST.get('patient_gender', 'Unknown')
        doctor_id = request.POST.get('doctor_id')  # optional now

        symptoms = get_disease_from_symptoms(raw.split(','))
        dis_list, options = clarify_disease(symptoms)

        if options:
            return JsonResponse({
                "symptom_options": options,
                "symptom_base": raw
            })

        elif dis_list:
            top_disease = dis_list[0][0]
            threshold = check_report_status(raw, top_disease.lower())
            meds = get_medicine_for_disease(top_disease)
            probability = "95%"  # placeholder
            severity = determine_severity(threshold["details"])

            ai_analysis = build_ai_analysis(top_disease, probability, severity, threshold, meds)

            # Save the report ONLY if doctor_id is provided (i.e., sending to doctor)
            if doctor_id:
                SentSymptomReport.objects.create(
                    doctor_id=doctor_id,
                    patient_name=name,
                    patient_age=age,
                    patient_gender=gender,
                    symptoms=raw,
                    ai_analysis=ai_analysis
                )

            return JsonResponse({
                "symptom_diseases": [top_disease],
                "medicines": meds,
                "ai_analysis": ai_analysis
            })

        return JsonResponse({"error": "No disease found for given symptoms"}, status=404)

    return JsonResponse({"error": "Invalid method"}, status=405)


@csrf_exempt
def handle_clarification(request):
    if request.method == 'POST':
        base = request.POST.get('symptom_base', '')
        clarification = request.POST.get('clarification', '')

        symptoms = get_disease_from_symptoms(base.split(','))
        symptoms.append(clarification.strip())

        dis_list, _ = clarify_disease(symptoms)

        if dis_list:
            top = dis_list[0][0]
            meds = get_medicine_for_disease(top)
            return JsonResponse({
                "symptom_diseases": [top],
                "medicines": meds
            })

        return JsonResponse({"error": "No disease match after clarification"}, status=404)

    return JsonResponse({"error": "Invalid method"}, status=405)

@csrf_exempt
def handle_side_effects(request):
    if request.method == 'POST':
        name = request.POST.get('medicine_name')
        if not name:
            return JsonResponse({"error": "Medicine name required"}, status=400)

        effects = fetch_side_effects(name)
        return JsonResponse({"side_effects": effects})

    return JsonResponse({"error": "Invalid method"}, status=405)

@csrf_exempt
def download_pdf(request):
    if request.method == 'POST':
        disease = request.POST.get('disease')
        text = request.POST.get('ocr_text')

        if not disease or not text:
            return JsonResponse({"error": "Missing data"}, status=400)

        predictions = predict_disease(text)
        if disease not in predictions:
            return JsonResponse({"error": "Invalid disease"}, status=400)

        result = predictions[disease]
        thresholds = check_report_status(text, disease)
        meds = get_medicine_for_disease(disease)

        return FileResponse(
            generate_diagnosis_pdf(
                disease_name=disease,
                prediction_data=result,
                thresholds=thresholds["details"],
                medicines=meds,
                show_threshold_only=False,
                final_decision=thresholds["status"]
            ),
            as_attachment=True,
            filename=f"{disease}_report.pdf"
        )

    return JsonResponse({"error": "Invalid method"}, status=405)

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

@csrf_exempt
@csrf_exempt
def handle_save_report(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON'}, status=400)

        name = data.get('name')
        age = data.get('age')
        gender = data.get('gender')
        report_content = data.get('reportContent')
        prediction = data.get('prediction')

        if not all([name, age, gender, report_content, prediction]):
            return JsonResponse({'message': 'Missing data in request.'}, status=400)

        print("✅ Saving report:", {
            "name": name,
            "age": age,
            "gender": gender,
            "prediction": prediction
        })

        return JsonResponse({'message': 'Report saved successfully!'}, status=200)
    
    return JsonResponse({'message': 'Invalid request method'}, status=405)

class SymptomListView(APIView):
    def get(self, request):
        print("✅ SymptomListView GET hit")

        common_symptoms = []
        unique_symptoms = []

        for symptom in Symptom.objects.prefetch_related('diseases'):
            count = symptom.diseases.count()
            if count == 1:
                unique_symptoms.append(symptom.name)
            elif count >= 3:
                common_symptoms.append(symptom.name)

        return Response({
            "common": sorted(common_symptoms),
            "unique": sorted(unique_symptoms)
        })

def build_ai_analysis(disease, probability, severity, threshold, meds):
    medicines_text = "\n".join([
        f"Take {m['name']} (More: {m['link']})" for m in meds
    ]) if meds else "No specific medicines recommended."

    return (
        f"{disease}\n"
        f"AI suggests a match with {disease}.\n\n"
        f"{probability} Probability\n"
        f"{severity.upper()} RISK\n"
        f"Recommendation: {threshold['recommendation']}\n\n"
        f"Suggested Medicines:\n{medicines_text}"
    )

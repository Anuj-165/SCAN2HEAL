# utils/speciality_mapping.py

DISEASE_SPECIALITY_MAP = {
    # General Physician
    "Common Cold": "General Physician",
    "Colds & Flu": "General Physician",
    "Flu": "General Physician",
    "Covid 19": "General Physician",
    "Typhoid": "General Physician",
    "Allergy": "General Physician",
    "Allergies": "General Physician",
    "Chronic cholestasis": "General Physician",
    "Constipation": "General Physician",
    "Dark urine": "General Physician",
    "Chills": "General Physician",
    "Chicken pox": "General Physician",
    "Swine Flu": "General Physician",

    # Infectious Disease
    "Dengue": "Infectious Disease",
    "Malaria": "Infectious Disease",
    "Tuberculosis": "Infectious Disease",
    "AIDS": "Infectious Disease",
    "AIDS/HIV": "Infectious Disease",
    "Hepatitis A": "Infectious Disease",
    "Hepatitis B": "Infectious Disease",
    "Hepatitis C": "Infectious Disease",
    "Hepatitis D": "Infectious Disease",
    "Hepatitis E": "Infectious Disease",

    # Cardiologist
    "Heart attack": "Cardiologist",
    "Angina": "Cardiologist",
    "Hypertension": "Cardiologist",
    "Cholesterol": "Cardiologist",

    # Endocrinologist
    "Diabetes": "Endocrinologist",
    "Diabetes (Type 1)": "Endocrinologist",
    "Diabetes (Type 2)": "Endocrinologist",
    "Hypoglycemia": "Endocrinologist",
    "Hyperthyroidism": "Endocrinologist",
    "Hypothyroidism": "Endocrinologist",

    # Neurologist
    "Migraine": "Neurologist",
    "Stroke": "Neurologist",
    "Paralysis (brain hemorrhage)": "Neurologist",
    "Seizures": "Neurologist",
    "(vertigo) Paroymsal  Positional Vertigo": "Neurologist",

    # Psychiatrist
    "Depression": "Psychiatrist",
    "Anxiety": "Psychiatrist",
    "Bipolar Disorder": "Psychiatrist",
    "Schizophrenia": "Psychiatrist",
    "ADHD": "Psychiatrist",
    "Insomnia": "Psychiatrist",

    # Gastroenterologist
    "GERD": "Gastroenterologist",
    "GERD (Heartburn)": "Gastroenterologist",
    "Gastroenteritis": "Gastroenterologist",
    "Peptic ulcer diseae": "Gastroenterologist",
    "Jaundice": "Gastroenterologist",

    # Pulmonologist
    "Asthma": "Pulmonologist",
    "Bronchial Asthma": "Pulmonologist",
    "Bronchitis": "Pulmonologist",
    "COPD": "Pulmonologist",
    "Pneumonia": "Pulmonologist",

    # Dermatologist
    "Eczema": "Dermatologist",
    "Fungal infection": "Dermatologist",
    "Psoriasis": "Dermatologist",
    "Hair Loss": "Dermatologist",
    "Impetigo": "Dermatologist",
    "Acne": "Dermatologist",
    "Herpes": "Dermatologist",

    # Nephrologist
    "UTI": "Nephrologist",
    "Urinary tract infection": "Nephrologist",
    "Incontinence": "Nephrologist",

    # Hepatologist
    "Alcoholic hepatitis": "Hepatologist",
    "Hepatitis A": "Hepatologist",
    "Hepatitis B": "Hepatologist",
    "Hepatitis C": "Hepatologist",
    "Hepatitis D": "Hepatologist",
    "Hepatitis E": "Hepatologist",

    # Rheumatologist / Orthopedic
    "Arthritis": "Rheumatologist",
    "Osteoarthristis": "Orthopedic",
    "Osteoarthritis": "Orthopedic",
    "Rheumatoid Arthritis": "Rheumatologist",
    "Gout": "Rheumatologist",

    # Urologist / Andrologist
    "Erectile Dysfunction": "Andrologist",

    # Nutritionist / Endocrinologist
    "Weight Loss": "Nutritionist",

    # Psychologist / Pain Specialist
    "Pain": "Pain Management Specialist",

    # Menopause / Gynae
    "Menopause": "Gynaecologist",

    # Drug Reaction / General Medicine
    "Drug Reaction": "General Physician",

    # Skin
    "Dimorphic hemmorhoids(piles)": "General Surgeon",

    # Bowel / Gastro
    "IBD (Bowel)": "Gastroenterologist",

    # Unsorted but relevant guesses:
    "Cancer": "Oncologist",
    "Osteoporosis": "Orthopedic",
    "Cervical spondylosis": "Orthopedic",
    "Alzheimer's": "Neurologist",

    # For OCR diseases (grouped)
    "Liver": "Hepatologist",
    "Kidney": "Nephrologist",
    "Diabetes": "Endocrinologist",
    "Heart": "Cardiologist",
    
}
# Normalize keys: convert all string keys to lowercase (ignore empty or non-string keys)
DISEASE_SPECIALITY_MAP = {
    str(k).lower(): v for k, v in DISEASE_SPECIALITY_MAP.items() if isinstance(k, str) and k.strip() != ''
}


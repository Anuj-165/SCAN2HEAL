from django.core.management.base import BaseCommand
import pandas as pd
from ocr_app.models import Disease, Symptom

class Command(BaseCommand):
    help = 'Import diseases and symptoms from dataset.csv'

    def handle(self, *args, **kwargs):
        path = 'ocr_app/dataset.csv'  # Use relative path or full path
        df = pd.read_csv(path)
        total = len(df)

        for i, row in df.iterrows():
            disease_name = row['Disease'].strip()
            disease, _ = Disease.objects.get_or_create(name=disease_name)

            for col in row.index:
                if col != 'Disease' and pd.notna(row[col]):
                    symptom_name = str(row[col]).strip()
                    symptom, _ = Symptom.objects.get_or_create(name=symptom_name)
                    symptom.diseases.add(disease)

            if (i + 1) % 100 == 0 or i + 1 == total:
                self.stdout.write(f'✅ Processed {i+1}/{total} rows')

        self.stdout.write('🎉 Symptoms/Diseases Import Complete!')

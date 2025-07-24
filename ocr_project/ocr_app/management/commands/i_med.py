from django.core.management.base import BaseCommand
import pandas as pd
from ocr_app.models import Disease, Medicine

class Command(BaseCommand):
    help = 'Import medicines for diseases from drugs_for_common_treatments.csv'

    def handle(self, *args, **kwargs):
        path = 'ocr_app/drugs_for_common_treatments.csv'
        df = pd.read_csv(path)
        total = len(df)

        for i, row in df.iterrows():
            try:
                disease_name = str(row['medical_condition']).strip()
                drug_name = str(row['drug_name']).strip()
                link = str(row['drug_link']).strip()

                if disease_name and drug_name and link:
                    disease, _ = Disease.objects.get_or_create(name=disease_name)
                    Medicine.objects.get_or_create(
                        name=drug_name,
                        link=link,
                        disease=disease
                    )

                if (i + 1) % 100 == 0 or i + 1 == total:
                    self.stdout.write(f'✅ Processed {i+1}/{total} rows')

            except Exception as e:
                self.stdout.write(f'❌ Error in row {i+1}: {e}')

        self.stdout.write('🎉 Medicines Import Complete!')

from django.db import models


class Disease(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Symptom(models.Model):
    name = models.CharField(max_length=100)
    diseases = models.ManyToManyField(Disease)

    def __str__(self):
        return self.name

class Medicine(models.Model):
    name = models.CharField(max_length=100)
    link = models.URLField()
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE)
    

    def __str__(self):
        return self.name


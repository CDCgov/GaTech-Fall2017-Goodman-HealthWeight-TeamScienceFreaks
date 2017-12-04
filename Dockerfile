FROM python:2

COPY ./Fall-2016/patient-facing-app .

RUN pip install -r requirements.txt

RUN python manage.py migrate

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

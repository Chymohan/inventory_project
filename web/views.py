from django.shortcuts import render, redirect

def index(request):
    return render(request, 'web/index.html')

def login_page(request):
    return render(request, 'web/login.html')
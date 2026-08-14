"""
Script para crear un usuario superadmin sin usar el panel de Django.
Ejecuta: python create_admin.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confiig.settings')
django.setup()

from apps.users.models import Usuario

def crear_admin():
    print("=== Crear Superusuario ===\n")

    email = input("Email del admin: ").strip()
    if not email:
        print("El email es obligatorio")
        return

    # Verificar si ya existe
    if Usuario.objects.filter(email=email).exists():
        print(f"El email {email} ya está registrado")
        return

    nombres = input("Nombres: ").strip()
    if not nombres:
        print("Los nombres son obligatorios")
        return

    apellidos = input("Apellidos: ").strip()
    if not apellidos:
        print("Los apellidos son obligatorios")
        return

    telefono = input("Teléfono: ").strip()
    if not telefono:
        print("El teléfono es obligatorio")
        return

    fecha_nacimiento = input("Fecha de nacimiento (YYYY-MM-DD): ").strip()
    if not fecha_nacimiento:
        print("La fecha de nacimiento es obligatoria")
        return

    password = input("Contraseña: ").strip()
    if not password:
        print("La contraseña es obligatoria")
        return

    # Crear superusuario
    try:
        admin = Usuario.objects.create_superuser(
            email=email,
            password=password,
            nombres=nombres,
            apellidos=apellidos,
            telefono=telefono,
            fecha_nacimiento=fecha_nacimiento
        )

        # Asegurar que esté activo
        admin.is_active = True
        admin.save()

        print(f"\n✅ Usuario admin creado exitosamente!")
        print(f"   Email: {admin.email}")
        print(f"   Nombre: {admin.nombres} {admin.apellidos}")
        print(f"   is_active: {admin.is_active}")
        print(f"   is_staff: {admin.is_staff}")
        print(f"   is_superuser: {admin.is_superuser}")

    except Exception as e:
        print(f"\n❌ Error al crear el admin: {e}")

if __name__ == "__main__":
    crear_admin()

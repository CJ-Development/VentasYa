from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Oferta
from .serializers import OfertaSerializer
from .services import OfertaService

from utils.permissions import IsAdministradorOrReadOnly


class OfertaView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request):

        ofertas = OfertaService.listar()

        serializer = OfertaSerializer(ofertas, many=True)

        return Response(serializer.data)

    def post(self, request):

        serializer = OfertaSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        oferta = OfertaService.crear(serializer.validated_data)

        return Response(
            OfertaSerializer(oferta).data,
            status=status.HTTP_201_CREATED,
        )


class OfertaDetalleView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, id):

        oferta = get_object_or_404(Oferta, id_oferta=id)

        return Response(OfertaSerializer(oferta).data)

    def put(self, request, id):

        oferta = get_object_or_404(Oferta, id_oferta=id)

        serializer = OfertaSerializer(oferta, data=request.data)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        oferta.refresh_from_db()

        return Response(OfertaSerializer(oferta).data)

    def delete(self, request, id):

        OfertaService.eliminar(id)

        return Response(status=status.HTTP_204_NO_CONTENT)

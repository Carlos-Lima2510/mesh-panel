#!/usr/bin/env bash
# ==============================================================================
# Script de prueba interactivo para la simulación de telemetría de Switch
# ==============================================================================

DAEMON_URL="http://localhost:3001"

echo "=========================================================="
echo "      SIMULADOR DE TELEMETRÍA DE SWITCH (CAMINO 2)        "
echo "=========================================================="
echo "1) Simular CABLE DESCONECTADO en UEA-C403 (Port 5 -> DOWN 0M)       -> [NARANJA]"
echo "2) Simular PC APAGADO EN STANDBY en UEA-C403 (Port 5 -> UP 10M WoL)  -> [GRIS]"
echo "3) Simular FALLO LÓGICO / DHCP en UEA-C403 (Port 5 -> UP 1000M 1G)   -> [AMARILLO]"
echo "4) Consultar estado actual de puertos del switch (/api/switch)"
echo "5) Salir"
echo "=========================================================="

read -p "Selecciona una opción [1-5]: " opcion

case $opcion in
  1)
    echo "[*] Enviando evento: Port 5 -> DOWN (Cable desconectado)..."
    curl -s -X POST "$DAEMON_URL/api/switch" \
      -H "Content-Type: application/json" \
      -d '{"nombre":"UEA-C403","port":5,"link":"DOWN","speed":0}' | python3 -m json.tool
    echo "[+] Listo. Abre http://localhost:8080 y pulsa 'Consultar Estado' para ver UEA-C403 en NARANJA."
    ;;
  2)
    echo "[*] Enviando evento: Port 5 -> UP @ 10 Mbps (PC apagado en standby WoL)..."
    curl -s -X POST "$DAEMON_URL/api/switch" \
      -H "Content-Type: application/json" \
      -d '{"nombre":"UEA-C403","port":5,"link":"UP","speed":10}' | python3 -m json.tool
    echo "[+] Listo. Abre http://localhost:8080 y pulsa 'Consultar Estado' para ver UEA-C403 en GRIS."
    ;;
  3)
    echo "[*] Enviando evento: Port 5 -> UP @ 1000 Mbps (Cable conectado 1G, fallo lógico)..."
    curl -s -X POST "$DAEMON_URL/api/switch" \
      -H "Content-Type: application/json" \
      -d '{"nombre":"UEA-C403","port":5,"link":"UP","speed":1000}' | python3 -m json.tool
    echo "[+] Listo. Abre http://localhost:8080 y pulsa 'Consultar Estado' para ver UEA-C403 en AMARILLO."
    ;;
  4)
    echo "[*] Puertos actuales del switch:"
    curl -s "$DAEMON_URL/api/switch" | python3 -m json.tool
    ;;
  5)
    echo "Saliendo."
    ;;
  *)
    echo "Opción no válida."
    ;;
esac

#!/usr/bin/env bash
# ==============================================================================
# Script de prueba interactivo para Switch Virtual SNMP Real (tfg-switch)
# ==============================================================================

echo "=========================================================="
echo "      CONTROL DEL SWITCH VIRTUAL SNMP REAL (tfg-switch)   "
echo "=========================================================="
echo "1) Desconectar cable en UEA-C403 (port5 DOWN)        -> [NARANJA]"
echo "2) Conectar cable en UEA-C403 (port5 UP)             -> [GRIS (Apagado en Standby)]"
echo "3) Desconectar cable en UEA-C226 (port1 DOWN)        -> [NARANJA]"
echo "4) Conectar cable en UEA-C226 (port1 UP)             -> [VERDE (Operativo)]"
echo "5) Ver tabla SNMP MIB-II de puertos en tfg-switch"
echo "6) Salir"
echo "=========================================================="

read -p "Selecciona una opción [1-6]: " opcion

case $opcion in
  1)
    echo "[*] Desconectando cable físico en port5 (UEA-C403)..."
    docker exec tfg-switch ip link set port5 down
    echo "[+] Listo. Consulta http://localhost:8080 o /api/devices para ver UEA-C403 en NARANJA."
    ;;
  2)
    echo "[*] Conectando cable físico en port5 (UEA-C403)..."
    docker exec tfg-switch ip link set port5 up
    echo "[+] Listo. Consulta http://localhost:8080 o /api/devices para ver UEA-C403 en AMARILLO."
    ;;
  3)
    echo "[*] Desconectando cable físico en port1 (UEA-C226)..."
    docker exec tfg-switch ip link set port1 down
    echo "[+] Listo. Consulta http://localhost:8080 o /api/devices para ver UEA-C226 en NARANJA."
    ;;
  4)
    echo "[*] Conectando cable físico en port1 (UEA-C226)..."
    docker exec tfg-switch ip link set port1 up
    echo "[+] Listo. Consulta http://localhost:8080 o /api/devices para ver UEA-C226 en VERDE."
    ;;
  5)
    echo "[*] Consulta SNMP real (snmpwalk ifOperStatus) a virtual-switch:1616..."
    docker exec tfg-daemon snmpwalk -v2c -c public virtual-switch:1616 1.3.6.1.2.1.2.2.1.8
    ;;
  6)
    echo "Saliendo."
    ;;
  *)
    echo "Opción no válida."
    ;;
esac

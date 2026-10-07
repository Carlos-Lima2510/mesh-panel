#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE PRUEBA INTERACTIVO: SWITCH SNMP VIRTUAL (tfg-switch)
# ==============================================================================

echo "=========================================================="
echo "      CONTROL DEL SWITCH SNMP VIRTUAL (tfg-switch)        "
echo "=========================================================="
echo "1) Desconectar cable en ubuntu (port1 DOWN)  -> [NARANJA]"
echo "2) Conectar cable en ubuntu (port1 UP)       -> [VERDE]"
echo "3) Ver consulta SNMP MIB-II real (snmpwalk ifOperStatus)"
echo "4) Salir"
echo "=========================================================="

read -p "Selecciona una opción [1-4]: " opcion

case $opcion in
  1)
    echo "[*] Desconectando cable físico en port1 (ubuntu)..."
    docker exec tfg-switch ip link set port1 down
    echo "[+] Listo. Abre http://localhost:8080 y pulsa 'Consultar' para ver ubuntu en NARANJA."
    ;;
  2)
    echo "[*] Conectando cable físico en port1 (ubuntu)..."
    docker exec tfg-switch ip link set port1 up
    echo "[+] Listo. Abre http://localhost:8080 y pulsa 'Consultar' para ver ubuntu en VERDE."
    ;;
  3)
    echo "[*] Ejecutando snmpwalk a virtual-switch:1616 (ifOperStatus)..."
    docker exec tfg-daemon snmpwalk -v2c -c public virtual-switch:1616 1.3.6.1.2.1.2.2.1.8
    ;;
  4)
    echo "Saliendo."
    ;;
  *)
    echo "Opción no válida."
    ;;
esac

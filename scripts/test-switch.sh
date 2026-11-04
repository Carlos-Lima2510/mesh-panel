#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE PRUEBA: SWITCH SNMP VIRTUAL (tfg-switch)
# ==============================================================================

echo "=========================================================="
echo "      CONTROL DEL SWITCH SNMP VIRTUAL (tfg-switch)        "
echo "=========================================================="
echo "Puestos del Laboratorio:"
echo "  port1 -> UEA-C226"
echo "  port2 -> UEA-C232"
echo "  port3 -> UEA-C234"
echo "  port4 -> UEA-C236"
echo "  port5 -> UEA-C403"
echo "----------------------------------------------------------"
echo "Acciones rápidas:"
echo "  1) Desconectar cable en UEA-C226 (port1 DOWN) -> [NARANJA]"
echo "  2) Conectar cable en UEA-C226 (port1 UP)      -> [VERDE]"
echo "  3) Desconectar cable en UEA-C403 (port5 DOWN) -> [NARANJA]"
echo "  4) Conectar cable en UEA-C403 (port5 UP)      -> [VERDE]"
echo "  5) Conectar TODOS los puertos (port1..port8 UP)"
echo "  6) Ver estado SNMP real (snmpwalk ifOperStatus)"
echo "  7) Salir"
echo "=========================================================="

read -p "Selecciona una opción [1-7]: " opcion

case $opcion in
  1)
    echo "[*] Desconectando cable físico en port1 (UEA-C226)..."
    docker exec tfg-switch ip link set port1 down
    echo "[+] Listo. Revisa el panel web para ver UEA-C226 en NARANJA."
    ;;
  2)
    echo "[*] Conectando cable físico en port1 (UEA-C226)..."
    docker exec tfg-switch ip link set port1 up
    echo "[+] Listo. UEA-C226 vuelve a estar conectado (VERDE)."
    ;;
  3)
    echo "[*] Desconectando cable físico en port5 (UEA-C403)..."
    docker exec tfg-switch ip link set port5 down
    echo "[+] Listo. Revisa el panel web para ver UEA-C403 en NARANJA."
    ;;
  4)
    echo "[*] Conectando cable físico en port5 (UEA-C403)..."
    docker exec tfg-switch ip link set port5 up
    echo "[+] Listo. UEA-C403 restaurado."
    ;;
  5)
    echo "[*] Levantando todos los puertos del switch (port1..port8)..."
    for i in {1..8}; do
      docker exec tfg-switch ip link set "port$i" up
    done
    echo "[+] Todos los puertos están en estado UP."
    ;;
  6)
    echo "[*] Consultando OID ifOperStatus (1=UP, 2=DOWN) vía SNMP en virtual-switch:1616..."
    docker exec tfg-daemon snmpwalk -v2c -c public -Oqn virtual-switch:1616 1.3.6.1.2.1.2.2.1.8
    ;;
  7)
    echo "Saliendo."
    ;;
  *)
    echo "Opción no válida."
    ;;
esac

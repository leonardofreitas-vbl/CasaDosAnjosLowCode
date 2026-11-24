"""Servidor simples para a rede local. Uso: python serve.py"""
import http.server, socket, os, functools

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def ips():
    out = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80)); out.add(s.getsockname()[0]); s.close()
    except OSError:
        pass
    return sorted(out) or ["SEU-IP"]

Handler = functools.partial(http.server.SimpleHTTPRequestHandler)
srv = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
print("=" * 50)
print(" PIANO DE BLOCOS rodando!")
print(" Nos computadores das criancas, abra no navegador:")
for ip in ips():
    print(f"     http://{ip}:{PORT}")
print(f" Neste computador: http://localhost:{PORT}")
print(" (Feche esta janela para desligar)")
print("=" * 50)
srv.serve_forever()

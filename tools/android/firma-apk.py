#!/usr/bin/env python3
"""Firma un APK con lo schema v2 (APK Signature Scheme v2, Android 7+), senza l'SDK Android.

Uso: python3 tools/android/firma-apk.py entrata.apk uscita.apk chiave.jks   (password nella variabile KS_PASS)
La chiave è un PKCS12 (keytool -storetype PKCS12) con una chiave RSA. Serve il pacchetto `cryptography`.
L'APK in entrata deve essere già allineato (quello di `gradle assembleRelease` lo è) e non firmato con v2.
Formato: https://source.android.com/docs/security/features/apksigning/v2
"""
import hashlib
import os
import struct
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

RSA_PKCS1_SHA256 = 0x0103
ID_V2 = 0x7109871A
MAGIA = b'APK Sig Block 42'
PEZZO = 1 << 20


def lp(b):  # prefisso di lunghezza uint32
    return struct.pack('<I', len(b)) + b


def eocd(dati):
    i = dati.rfind(b'PK\x05\x06', max(0, len(dati) - 65557))
    if i < 0:
        raise SystemExit('non è uno zip (manca la fine della directory centrale)')
    cd_dim, cd_ofs = struct.unpack('<II', dati[i + 12:i + 20])
    if dati[cd_ofs - 16:cd_ofs] == MAGIA:
        raise SystemExit("l'APK ha già un blocco di firma")
    return i, cd_ofs, cd_dim


def riassunto(sezioni):
    pezzi = []
    for s in sezioni:
        for k in range(0, len(s), PEZZO):
            c = s[k:k + PEZZO]
            pezzi.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + struct.pack('<I', len(pezzi)) + b''.join(pezzi)).digest()


def firma(entrata, uscita, jks, pw):
    dati = open(entrata, 'rb').read()
    ie, cd_ofs, cd_dim = eocd(dati)
    if cd_ofs + cd_dim != ie:
        raise SystemExit('zip inatteso: la directory centrale non è attaccata alla fine')
    voci, cd, fine = dati[:cd_ofs], dati[cd_ofs:ie], dati[ie:]

    chiave, cert, _ = pkcs12.load_key_and_certificates(open(jks, 'rb').read(), pw.encode())
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    pub = cert.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)

    # nel riassunto la fine (EOCD) punta all'inizio del blocco di firma, cioè al vecchio inizio della directory centrale
    r = riassunto([voci, cd, fine])
    firmati = lp(lp(struct.pack('<I', RSA_PKCS1_SHA256) + lp(r))) + lp(lp(cert_der)) + lp(b'')
    sig = chiave.sign(firmati, padding.PKCS1v15(), hashes.SHA256())
    firmatario = lp(firmati) + lp(lp(struct.pack('<I', RSA_PKCS1_SHA256) + lp(sig))) + lp(pub)
    valore = lp(lp(firmatario))
    coppia = struct.pack('<QI', 4 + len(valore), ID_V2) + valore
    dim = len(coppia) + 8 + 16  # coppie + seconda dimensione + magia
    blocco = struct.pack('<Q', dim) + coppia + struct.pack('<Q', dim) + MAGIA

    nuova_fine = fine[:16] + struct.pack('<I', cd_ofs + len(blocco)) + fine[20:]
    with open(uscita, 'wb') as f:
        f.write(voci + blocco + cd + nuova_fine)


if __name__ == '__main__':
    if len(sys.argv) != 4 or 'KS_PASS' not in os.environ:
        raise SystemExit(__doc__)
    firma(sys.argv[1], sys.argv[2], sys.argv[3], os.environ['KS_PASS'])
    print('firmato:', sys.argv[2])

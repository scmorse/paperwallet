# paperwallet


Paper wallet generator using a password to generate a simple XOR cipher.

##

Generates HTML file with encrypted private key:

```
node pw.js generate {password} {privateKey} {address} {lastKnownAmount}
```

Decrypts:

```
node pw.js decrypt {password} {encryptedPrivateKey}
```
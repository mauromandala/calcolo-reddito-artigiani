# Calcolo Netto Artigiano — Regime Forfettario 2025

Calcolatore web del reddito netto per **artigiani in regime forfettario**, aggiornato ai parametri 2025 e alla riduzione contributiva del 50% per le nuove iscrizioni (Legge di Bilancio 2025).

👉 **[Apri il calcolatore](https://mauromandala.github.io/calcolo-reddito-artigiani/)**

## Cosa calcola

Inserito il fatturato annuo lordo, l'app restituisce:

- **Reddito netto annuo** e il corrispettivo mensile (12, 13 o 14 mensilità)
- **Contributi INPS** dovuti, con dettaglio tra quota fissa ed eccedenza sul minimale
- **Imposta sostitutiva** (5% startup o 15% ordinaria)
- **Imponibile lordo** e imponibile netto ai fini fiscali
- **Quota da accantonare** su ogni 1.000 € incassati, per non trovarsi scoperti a fine anno

## Parametri e logica

| Voce | Valore 2025 |
|---|---|
| Coefficiente di redditività artigiani | 67% (modificabile) |
| Minimale reddito INPS | € 18.556 |
| Contributi fissi INPS | € 4.460,64 |
| Aliquota sull'eccedenza | 24% |
| Imposta sostitutiva | 5% (primi 5 anni) o 15% |
| Riduzioni contributive | −50% nuove iscrizioni 2025, −35% ordinaria |

Il calcolo segue questi passaggi:

1. **Imponibile** = fatturato × coefficiente di redditività
2. **INPS** = quota fissa + 24% sulla parte di imponibile eccedente il minimale, il tutto ridotto secondo l'agevolazione scelta
3. **Imposta** = (imponibile − contributi INPS *versati* l'anno precedente) × aliquota
4. **Netto** = fatturato − INPS dovuti − imposta

La deduzione contributiva segue il **principio di cassa**: si deduce quanto effettivamente versato nell'anno, non quanto maturato. Per questo il contributo versato l'anno precedente è un campo di input separato.

## Uso in locale

Nessuna dipendenza e nessun build: è HTML, CSS e JavaScript vanilla.

```bash
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

## Struttura

```
index.html    markup del calcolatore
script.js     logica di calcolo e aggiornamento UI
style.css     stile (glassmorphism, font Outfit)
```

I parametri normativi sono costanti in cima a `script.js`: per aggiornare all'anno successivo basta modificare quelle.

## Disclaimer

I risultati sono **stime** basate sulla normativa vigente e non sostituiscono la consulenza di un commercialista. Situazioni particolari (cassa integrativa, redditi da lavoro dipendente concorrenti, cause di esclusione dal forfettario) non sono coperte.

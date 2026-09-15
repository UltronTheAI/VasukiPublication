# VasukiPublication — Native Advertisements Model

VasukiPublication incorporates a restrained, high-respect native advertising model designed to fund platform operations without compromising reader privacy, reading immersion, or website performance.

---

## 1. Core Principles & Boundaries

1. **Zero Reader Ads Invariant**:
   - Advertisements are strictly prohibited inside the book reader container (`/book/[slug]/read`).
   - The reader is an isolated, distraction-free environment.
2. **Zero Third-Party Trackers**:
   - No tracking pixels, Google Tag Manager scripts, cookie synchronizers, or external ad network SDKs.
   - All ad components render purely from first-party MongoDB documents.
3. **Transparent Outbound Links**:
   - All external sponsor links open via an explicit security confirmation dialog (`components/ads/ExternalLinkModal.tsx`).
   - Links are annotated with `rel="noopener noreferrer nofollow"`.
4. **Restrained Placements**:
   - Native ads appear only in discovery spaces:
     - `home_banner`: Homepage mid-feed horizontal card.
     - `home_sidebar`: Homepage discovery sidebar widget.
     - `saved_banner`: Saved books page horizontal card.
     - `saved_sidebar`: Saved books page sidebar widget.

---

## 2. Priority-Weighted Ad Selection Algorithm

Ad selection is computed server-side in `lib/repositories/ads.ts`:

- **Priority 1**: Weight 10 (Highest frequency)
- **Priority 2**: Weight 5 (Medium frequency)
- **Priority 3**: Weight 2 (Lowest frequency)

```typescript
export function selectWeightedAd(ads: Ad[], atTime?: Date): Ad | null {
  if (!ads || ads.length === 0) return null;
  const now = atTime || new Date();
  
  const eligible = ads.filter((ad) => {
    if (!ad.active) return false;
    if (ad.starts_at && new Date(ad.starts_at) > now) return false;
    if (ad.ends_at && new Date(ad.ends_at) < now) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const weights: Record<number, number> = { 1: 10, 2: 5, 3: 2 };
  const totalWeight = eligible.reduce((acc, ad) => acc + (weights[ad.priority] || 2), 0);

  let randomVal = Math.random() * totalWeight;
  for (const ad of eligible) {
    const w = weights[ad.priority] || 2;
    if (randomVal < w) return ad;
    randomVal -= w;
  }

  return eligible[0];
}
```

---

## 3. Privacy-Preserving Analytics

- Ad performance is measured via anonymous aggregate counters (`impressions` and `clicks`) on the MongoDB `ads` document.
- No personally identifiable information (PII), browser fingerprints, or IP addresses are logged.
- The Click-Through Rate (CTR) is calculated dynamically in the admin dashboard:
  $$\text{CTR} = \left( \frac{\text{Clicks}}{\text{Impressions}} \right) \times 100$$


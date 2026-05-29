export function skeletonGrid(count = 6) {
  return `<div class="product-grid">${Array.from({length:count}, () =>
    `<div class="skeleton skeleton-card" style="height:180px;border-radius:16px;background:var(--frosted);animation:skeleton-pulse 1.4s ease-in-out infinite"></div>`).join('')}</div>`;
}
export function skeletonText() {
  return `<div class="skeleton skeleton-text" style="height:16px;border-radius:8px;background:var(--frosted);animation:skeleton-pulse 1.4s ease-in-out infinite;margin-bottom:8px"></div><div class="skeleton skeleton-text short" style="height:12px;width:60%;border-radius:8px;background:var(--frosted);animation:skeleton-pulse 1.4s ease-in-out infinite"></div>`;
}

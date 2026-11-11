import { hasBackDesign, resolveBackImage } from './back-design.js';

export function deriveBackPages(layout, design) {
  if (!layout?.valid || !hasBackDesign(design)) return { hasBacks: false, pages: [] };
  const paperWidth = layout.config.paper.width;

  return {
    hasBacks: true,
    pages: layout.pages.map((page, pageIndex) => {
      const nextPage = page.map((position) => {
        const resolved = resolveBackImage(position, design);
        return {
          ...position,
          x: resolved.source === 'none' ? position.x : paperWidth - position.x - position.width,
          backImage: resolved.source === 'global' ? null : resolved.image,
          source: resolved.source
        };
      });
      nextPage.pageIndex = pageIndex;
      nextPage.background = design.global ?? null;
      nextPage.cardSize = page.cardSize;
      nextPage.offset = page.offset;
      nextPage.rows = page.rows;
      nextPage.columns = page.columns;
      return nextPage;
    })
  };
}

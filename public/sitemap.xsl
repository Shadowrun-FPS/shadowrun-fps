<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" doctype-system="about:legacy-compat" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Sitemap – Shadowrun FPS</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 48rem; margin: 0 auto; padding: 1.5rem; color: #e2e8f0; background: #0f172a; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          p { color: #94a3b8; margin-bottom: 1.5rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #334155; }
          th { color: #94a3b8; font-weight: 600; font-size: 0.875rem; }
          a { color: #38bdf8; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .priority { font-variant-numeric: tabular-nums; }
        </style>
      </head>
      <body>
        <h1>Sitemap</h1>
        <p>Shadowrun FPS – indexable pages. Crawlers use the raw XML; this view is for humans.</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>URL</th>
              <th>Last modified</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <tr>
                <td><xsl:value-of select="position()"/></td>
                <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                <td><xsl:value-of select="sitemap:lastmod"/></td>
                <td class="priority"><xsl:value-of select="sitemap:priority"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

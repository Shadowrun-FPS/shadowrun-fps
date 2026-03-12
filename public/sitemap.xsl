<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" doctype-system="about:legacy-compat" encoding="UTF-8" indent="yes"/>
  <xsl:variable name="base" select="'https://www.shadowrunfps.com'"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Sitemap – Shadowrun FPS</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; margin: 0; padding: 1.5rem 1.5rem 2rem; color: #e2e8f0; background: #0f172a; text-align: left; max-width: 56rem; }
          .header { margin-bottom: 2rem; }
          .logo-link { display: inline-block; margin-bottom: 0.5rem; }
          .logo-link img { display: block; height: 2rem; width: auto; }
          .back { color: #94a3b8; font-size: 0.875rem; }
          .back a { color: #38bdf8; text-decoration: none; }
          .back a:hover { text-decoration: underline; }
          .intro { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
          section { margin-bottom: 2rem; }
          section h2 { font-size: 1rem; font-weight: 600; color: #94a3b8; margin: 0 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; }
          th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #334155; vertical-align: top; }
          th { color: #94a3b8; font-weight: 600; font-size: 0.75rem; }
          td:first-child { min-width: 0; }
          td:nth-child(1) { word-break: break-all; overflow-wrap: break-word; }
          .priority { font-variant-numeric: tabular-nums; font-size: 0.875rem; }
          a { color: #38bdf8; text-decoration: none; word-break: break-all; overflow-wrap: break-word; }
          a:hover { text-decoration: underline; }
          @media (max-width: 640px) {
            table, thead, tbody, tr, th, td { display: block; }
            thead { display: none; }
            tr { border: 1px solid #334155; border-radius: 0.5rem; margin-bottom: 0.75rem; padding: 0.75rem; overflow: hidden; min-width: 0; }
            td { border: none; padding: 0.25rem 0; word-break: break-all; overflow-wrap: break-word; min-width: 0; max-width: 100%; }
            td::before { content: attr(data-label); font-weight: 600; color: #94a3b8; font-size: 0.75rem; display: block; margin-bottom: 0.15rem; }
            td:first-child { font-weight: 600; }
            td a { word-break: break-all; overflow-wrap: break-word; display: inline-block; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <a class="logo-link" href="{$base}/"><img src="/title.png" alt="Shadowrun FPS"/></a>
          <p class="back"><a href="{$base}/">← Back to site</a></p>
          <p class="intro">Indexable pages. Crawlers use the raw XML; this view is for humans.</p>
        </header>

        <section>
          <h2>Home</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[sitemap:loc=$base or sitemap:loc=concat($base,'/')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Get started</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/download')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Documentation</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/docs/')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Leaderboard &amp; community</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/leaderboard') or contains(sitemap:loc,'/moderation-log')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Legal</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/privacy') or contains(sitemap:loc,'/terms')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Tournaments</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/tournaments/')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Matches</h2>
          <table>
            <thead><tr><th>Page</th><th>Last modified</th><th>Priority</th></tr></thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url[contains(sitemap:loc,'/matches/')]">
                <xsl:call-template name="row"/>
              </xsl:for-each>
            </tbody>
          </table>
        </section>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="row">
    <tr>
      <td data-label="Page"><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
      <td data-label="Last modified"><xsl:value-of select="sitemap:lastmod"/></td>
      <td data-label="Priority" class="priority"><xsl:value-of select="sitemap:priority"/></td>
    </tr>
  </xsl:template>
</xsl:stylesheet>

/*\
title: $:/plugins/nikorion/chart/modules/lang.js
type: application/javascript
module-type: library
\*/

/*
 * lang.js — localisation helper
 *
 * Resolves translated strings for the <$chart> widget error messages.
 *
 * Translation tiddlers live at:
 *   $:/plugins/nikorion/chart/language/<lang-code>/<key>
 *
 * Fallback chain:
 *   1. Active language (e.g. fr-FR)
 *   2. en-GB — always bundled, always present
 *   3. The key itself — last resort, ensures the widget never shows a blank string
 *
 * Exported:
 *   getString(key) → string
 */
(function () {
  "use strict";

  // Base tiddler path shared by all language packs for this plugin.
  var LANG_BASE = "$:/plugins/nikorion/chart/language/";
  // Fallback locale: en-GB is always bundled, so it is always resolvable.
  var FALLBACK  = "en-GB";

  // Read the active UI language code from TiddlyWiki's language reference.
  // "$:/language" holds the title of the active language-pack tiddler;
  // that tiddler's `name` field carries the BCP-47 tag (e.g. "fr-FR").
  function getLangCode() {
    var ref = ($tw.wiki.getTiddlerText("$:/language") || "").trim();
    if (!ref) return FALLBACK;
    var t = $tw.wiki.getTiddler(ref);
    return (t && t.fields && t.fields.name) ? t.fields.name : FALLBACK;
  }

  // Return a localised string for `key`.
  // Falls back to en-GB when the active language has no entry for `key`,
  // and returns `key` itself as a last resort so the UI never shows blank.
  exports.getString = function getString(key) {
    var code = getLangCode();
    var text = $tw.wiki.getTiddlerText(LANG_BASE + code + "/" + key);
    if (text !== undefined && text !== "") return text;
    text = $tw.wiki.getTiddlerText(LANG_BASE + FALLBACK + "/" + key);
    return (text !== undefined && text !== "") ? text : key;
  };

})();

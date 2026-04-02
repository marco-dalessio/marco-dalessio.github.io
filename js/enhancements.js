/**
 * Portfolio Enhancements
 * 1. Filter bar — show/hide entries by skill category
 * 2. JD Matcher — score entries against a pasted job description
 */
(function ($) {

  /* ============================================================
     1.  FILTER BAR
     ============================================================ */
  $(document).on('click', '.filter-btn', function () {
    var filter = $(this).data('filter');

    $('.filter-btn').removeClass('active');
    $(this).addClass('active');

    if (filter === 'all') {
      $('.fh5co-entry, .section-header').removeClass('hidden-by-filter');
    } else {
      // Show/hide entries
      $('.fh5co-entry').each(function () {
        var tags = String($(this).data('tags') || '').split(',');
        if (tags.indexOf(filter) === -1) {
          $(this).addClass('hidden-by-filter');
        } else {
          $(this).removeClass('hidden-by-filter');
        }
      });

      // Hide a section header if all entries in its group are hidden
      $('.section-header').each(function () {
        var $entries = $(this).nextUntil('.section-header, footer', '.fh5co-entry');
        var anyVisible = $entries.filter(':not(.hidden-by-filter)').length > 0;
        if (anyVisible) {
          $(this).removeClass('hidden-by-filter');
        } else {
          $(this).addClass('hidden-by-filter');
        }
      });
    }

    // Clear any active matcher state when filter changes
    if ($('.fh5co-entry.match-active').length) {
      resetMatcher(false); // silent reset — keep textarea content
    }
  });


  /* ============================================================
     2.  JD MATCHER — toggle
     ============================================================ */
  $(document).on('click', '.jd-matcher-toggle', function () {
    $(this).closest('.jd-matcher').toggleClass('open');
  });


  /* ============================================================
     2.  JD MATCHER — scoring helpers
     ============================================================ */
  var STOP = new Set([
    'the','and','or','to','of','a','an','in','for','is','are','was','be',
    'have','has','had','with','that','this','at','by','from','as','on',
    'not','we','our','your','their','they','it','its','will','can','you',
    'all','also','more','new','use','used','using','based','within','across',
    'each','into','through','over','about','up','out','one','may','would',
    'should','could','which','who','when','than','but','team','work','strong',
    'high','role','skills','experience','ability','including','ensure',
    'provide','support','manage','working','help','key','build','drive',
    'develop','create','requires','required','preferred','plus','least',
    'years','proven','demonstrated','excellent','strong','solid','good',
    'well','highly','effectively','efficiently','cross','functional','global'
  ]);

  function tokenize(text) {
    var raw = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    var tokens = new Set();
    raw.forEach(function (t) {
      if (t.length > 2 && !STOP.has(t)) tokens.add(t);
    });
    return tokens;
  }

  function scoreEntry(jdTokens, keywordsStr) {
    if (!keywordsStr) return 0;
    var keywords = keywordsStr.toLowerCase().split(',').map(function (k) { return k.trim(); });
    var hits = 0;

    keywords.forEach(function (kw) {
      // Multi-word keyword: check all parts present
      var parts = kw.split(/\s+/);
      var matched = parts.every(function (part) {
        if (jdTokens.has(part)) return true;
        // Substring match: any JD token starts with this part (e.g. "facilit" matches "facilitation")
        for (var t of jdTokens) {
          if (t.startsWith(part) || part.startsWith(t)) return true;
        }
        return false;
      });
      if (matched) hits++;
    });

    return keywords.length > 0 ? Math.round((hits / keywords.length) * 100) : 0;
  }

  function resetMatcher(clearText) {
    if (clearText !== false) $('.jd-textarea').val('');
    $('.jd-hint').text('');
    $('.match-badge').remove();
    $('.fh5co-entry').removeClass('match-active match-highlight match-dim');
  }

  /* ---- Run matching ---- */
  $(document).on('click', '.jd-match-btn', function () {
    var jdText = $('.jd-textarea').val().trim();

    if (jdText.length < 30) {
      $('.jd-hint').text('Please paste a longer job description (at least a few sentences).');
      return;
    }
    $('.jd-hint').text('');

    // Reset filter bar to "All" so all entries are visible for scoring
    $('.filter-btn').removeClass('active');
    $('.filter-btn[data-filter="all"]').addClass('active');
    $('.fh5co-entry, .section-header').removeClass('hidden-by-filter');

    // Remove stale badges
    $('.match-badge').remove();

    var jdTokens = tokenize(jdText);
    var scores = [];

    $('.fh5co-entry').each(function () {
      var kw = $(this).data('keywords') || '';
      scores.push({ el: this, score: scoreEntry(jdTokens, String(kw)) });
    });

    var maxScore = Math.max.apply(null, scores.map(function (s) { return s.score; }));

    scores.forEach(function (item) {
      var $e   = $(item.el);
      var rel  = maxScore > 0 ? item.score / maxScore : 0;
      $e.addClass('match-active');

      if (item.score === 0 || rel < 0.2) {
        $e.addClass('match-dim').removeClass('match-highlight');
      } else {
        $e.addClass('match-highlight').removeClass('match-dim');
        var cls = rel >= 0.65 ? 'high' : 'medium';
        $e.find('h2').first()
          .append('<span class="match-badge ' + cls + '">' + item.score + '% match</span>');
      }
    });

    var matchCount = scores.filter(function (s) { return s.score > 0; }).length;
    var topCount   = scores.filter(function (s) { return maxScore > 0 && s.score / maxScore >= 0.2; }).length;
    $('.jd-hint').text(
      topCount + ' relevant ' + (topCount === 1 ? 'entry' : 'entries') +
      ' found across ' + matchCount + ' partial matches.'
    );
  });

  /* ---- Reset ---- */
  $(document).on('click', '.jd-reset-btn', function () {
    resetMatcher(true);
  });

}(jQuery));

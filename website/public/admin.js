'use strict';
const $ = id => document.getElementById(id);
$('login').addEventListener('submit', async event => {
  event.preventDefault();
  $('message').textContent = 'Checking access...';
  try {
    const response = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${$('password').value}` }, cache: 'no-store' });
    $('password').value = '';
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The dashboard could not be opened.');
    let views = 0n, downloads = 0n;
    $('rows').replaceChildren();
    for (const row of result.rows) {
      const tr = document.createElement('tr');
      for (const value of [row.day, row.event, row.os, row.count]) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }
      $('rows').append(tr);
      if (row.event === 'view') views += BigInt(row.count); else if (row.event === 'download') downloads += BigInt(row.count);
    }
    $('views').textContent = views.toLocaleString('en-AU'); $('downloads').textContent = downloads.toLocaleString('en-AU');
    $('window').textContent = 'Today and the previous 30 days. Dates use Australia/Melbourne.';
    $('data').hidden = false; $('login').hidden = true; $('message').textContent = '';
  } catch (error) { $('password').value = ''; $('message').textContent = error.message; }
});
$('lock').addEventListener('click', () => { $('data').hidden = true; $('rows').replaceChildren(); $('views').textContent = '0'; $('downloads').textContent = '0'; $('login').hidden = false; $('password').focus(); });

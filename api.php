<?php
// API del sitio: acceso del administrador, guardado automático y copias de seguridad.
// Todo lo privado vive en /private (bloqueado desde afuera).
declare(strict_types=1);
const PRIV = __DIR__ . '/private';   // Si podés, mové esta carpeta FUERA de public_html y cambiá esta línea.
const DATA = __DIR__ . '/data.json';
const IMGS = __DIR__ . '/img';

function https(): bool { return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'); }
function out(int $code, array $d): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function rj(string $f, $def = []) { if (!is_file($f)) return $def; $j = json_decode((string)file_get_contents($f), true); return $j === null ? $def : $j; }
function wj(string $f, $d): bool { $t = $f . '.tmp'; if (file_put_contents($t, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) return false; return rename($t, $f); }

function is_local(): bool { $ip = $_SERVER['REMOTE_ADDR'] ?? ''; return $ip === '127.0.0.1' || $ip === '::1'; }
if (!https() && !is_local()) out(426, ['error' => 'https_requerido']); // la contraseña nunca viaja sin cifrar
header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: same-origin'); header('Cache-Control: no-store'); header('X-Frame-Options: DENY');
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
session_name('stsess');
session_set_cookie_params(['lifetime' => 0, 'path' => $base, 'secure' => https(), 'httponly' => true, 'samesite' => 'Strict']);
session_start();

function is_admin(): bool { return !empty($_SESSION['adm']) && (time() - (int)($_SESSION['t'] ?? 0)) < 28800; }
function need_admin(bool $post = false): void {
  if (!is_admin()) out(401, ['error' => 'sesion']);
  $_SESSION['t'] = time();
  if ($post) {
    $o = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($o !== '') { $h = explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]; if (parse_url($o, PHP_URL_HOST) !== $h) out(403, ['error' => 'origen']); }
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) out(403, ['error' => 'csrf']);
  }
}
function body(): array { $raw = file_get_contents('php://input'); if (strlen((string)$raw) > 30 * 1024 * 1024) out(413, ['error' => 'muy_grande']); $j = json_decode((string)$raw, true); return is_array($j) ? $j : []; }

// ---------- limpieza de datos (solo se guardan campos conocidos) ----------
function s($v, int $max = 2000): string { if (!is_string($v)) return ''; $v = str_replace("\0", '', $v); return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max); }
function nm($v, float $min, float $max) { if (!is_numeric($v)) return null; $x = max($min, min($max, (float)$v)); return $x == floor($x) ? (int)$x : $x; }
function store_image(string $bin): ?string {
  if ($bin === '' || strlen($bin) > 8 * 1024 * 1024) return null;
  $info = @getimagesizefromstring($bin);
  if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) return null;
  $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2]];
  if (function_exists('imagecreatefromstring') && function_exists('imagejpeg')) { // se vuelve a generar la imagen: elimina cualquier contenido oculto
    $im = @imagecreatefromstring($bin);
    if ($im) { ob_start(); imagejpeg($im, null, 85); $nb = ob_get_clean(); imagedestroy($im); if ($nb) { $bin = $nb; $ext = 'jpg'; } }
  }
  if (!is_dir(IMGS)) @mkdir(IMGS, 0755, true);
  $name = sha1($bin) . '.' . $ext;
  if (!is_file(IMGS . '/' . $name)) file_put_contents(IMGS . '/' . $name, $bin);
  return 'img/' . $name;
}
function img($v): ?string {
  if (!is_string($v) || $v === '') return null;
  if (preg_match('#^img/[a-f0-9]{40}\.(jpg|png|webp)$#', $v)) return is_file(__DIR__ . '/' . $v) ? $v : null;
  if (preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$#', $v, $m)) { $b = base64_decode($m[2], true); return $b === false ? null : store_image($b); }
  return null;
}
function clean_data($d): array {
  if (!is_array($d) || !isset($d['products']) || !is_array($d['products'])) throw new Exception('formato');
  $c = is_array($d['cfg'] ?? null) ? $d['cfg'] : [];
  $cfg = ['name' => s($c['name'] ?? '', 120), 'sub' => s($c['sub'] ?? '', 200), 'wa' => preg_replace('/\D/', '', s($c['wa'] ?? '', 30)), 'addr' => s($c['addr'] ?? '', 200), 'hrs' => s($c['hrs'] ?? '', 200)];
  foreach (['dEf' => [0, 99, 10], 'dTr' => [0, 99, 5], 'mpCom' => [0, 90, 4.99], 'mp3' => [0, 90, 12.49], 'mp6' => [0, 90, 19.79], 'mpIva' => [0, 90, 21], 'rd' => [1, 100000, 100]] as $k => $r) $cfg[$k] = nm($c[$k] ?? null, $r[0], $r[1]) ?? $r[2];
  $cfg['banners'] = [];
  foreach (array_slice(is_array($c['banners'] ?? null) ? $c['banners'] : [], 0, 12) as $b) { if (!is_array($b)) continue; $cfg['banners'][] = ['img' => img($b['img'] ?? '') ?? '', 't' => s($b['t'] ?? '', 120), 's' => s($b['s'] ?? '', 200)]; }
  $prods = [];
  foreach (array_slice($d['products'], 0, 3000) as $p) {
    if (!is_array($p) || !preg_match('/^p[0-9a-z]{1,30}$/', (string)($p['id'] ?? ''))) continue;
    $imgs = []; foreach (array_slice(is_array($p['imgs'] ?? null) ? $p['imgs'] : [], 0, 8) as $im) { $x = img($im); if ($x) $imgs[] = $x; }
    $cash = nm($p['cash'] ?? null, 0, 1e9); if ($cash === null) continue;
    $prods[] = ['id' => $p['id'], 'title' => s($p['title'] ?? '', 200), 'cat' => s($p['cat'] ?? '', 100), 'brand' => s($p['brand'] ?? '', 100), 'model' => s($p['model'] ?? '', 100),
      'cash' => $cash, 'old' => nm($p['old'] ?? null, 0, 1e9), 'stock' => nm($p['stock'] ?? 0, 0, 1e6) ?? 0, 'desc' => s($p['desc'] ?? '', 3000), 'imgs' => $imgs,
      'feat' => !empty($p['feat']), 'offer' => !empty($p['offer']), 'best' => !empty($p['best'])];
  }
  $cats = []; foreach (array_slice(is_array($d['cats'] ?? null) ? $d['cats'] : [], 0, 200) as $x) { $x = s($x, 100); if ($x !== '' && !in_array($x, $cats, true)) $cats[] = $x; }
  $catx = [];
  foreach (is_array($d['catx'] ?? null) ? array_slice($d['catx'], 0, 200, true) : [] as $k => $x) { if (!is_array($x)) continue; $catx[s((string)$k, 100)] = ['pre' => s($x['pre'] ?? '', 100), 'brand' => !empty($x['brand']), 'desc' => s($x['desc'] ?? '', 1500), 'wd' => s($x['wd'] ?? '', 100), 'war' => s($x['war'] ?? '', 5000)]; }
  return ['cfg' => $cfg, 'products' => $prods, 'cats' => $cats, 'catx' => $catx ?: new stdClass];
}
function clean_brands($b): array|object {
  $o = [];
  if (is_array($b)) foreach (array_slice($b, 0, 300, true) as $k => $ms) { if (!is_array($ms)) continue; $k = s((string)$k, 100); if ($k === '') continue; $l = []; foreach (array_slice($ms, 0, 800) as $m) { $m = trim(s($m, 100)); if ($m !== '' && !in_array($m, $l, true)) $l[] = $m; } $o[$k] = $l; }
  return $o ?: new stdClass;
}

// ---------- copias de seguridad ----------
function snapshot(array $data, $brands): void {
  $dir = PRIV . '/backups'; @mkdir($dir . '/daily', 0750, true);
  $files = glob($dir . '/*.json') ?: []; rsort($files);
  $last = $files ? filemtime($files[0]) : 0; $now = time();
  $payload = json_encode(['t' => $now, 'data' => $data, 'brands' => $brands], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($now - $last >= 300) file_put_contents($dir . '/' . date('Ymd-His', $now) . '.json', $payload, LOCK_EX);
  $dd = $dir . '/daily/' . date('Ymd', $now) . '.json'; if (!is_file($dd)) file_put_contents($dd, $payload, LOCK_EX);
  $files = glob($dir . '/*.json') ?: []; rsort($files); foreach (array_slice($files, 100) as $f) @unlink($f);
  foreach (glob($dir . '/daily/*.json') ?: [] as $f) if (filemtime($f) < $now - 90 * 86400) @unlink($f);
}
function backup_path(string $id): ?string {
  if (preg_match('/^b:(\d{8}-\d{6})$/', $id, $m)) $f = PRIV . '/backups/' . $m[1] . '.json'; elseif (preg_match('/^d:(\d{8})$/', $id, $m)) $f = PRIV . '/backups/daily/' . $m[1] . '.json'; else return null;
  return is_file($f) ? $f : null;
}

// ---------- rutas ----------
$a = $_GET['a'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($a === 'boot') {
  if (!is_admin()) out(200, ['admin' => false]);
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  $_SESSION['t'] = time();
  out(200, ['admin' => true, 'csrf' => $_SESSION['csrf'], 'brands' => rj(PRIV . '/brands.json', new stdClass)]);
}
if ($a === 'js') { // el código del panel solo se entrega a quien ya inició sesión
  if (!is_admin()) { http_response_code(403); exit; }
  header('Content-Type: application/javascript; charset=utf-8'); readfile(PRIV . '/admin.js'); exit;
}
if ($a === 'login' && $method === 'POST') {
  $auth = rj(PRIV . '/auth.json', null);
  if (!$auth || empty($auth['hash'])) out(503, ['error' => 'sin_instalar']);
  $af = PRIV . '/attempts.json'; $k = sha1(($_SERVER['REMOTE_ADDR'] ?? '?')); $now = time();
  $all = rj($af, []); $mine = array_values(array_filter($all[$k] ?? [], fn($t) => $t > $now - 900));
  if (count($mine) >= 5) { $wait = max(1, 900 - ($now - min($mine))); out(429, ['error' => 'bloqueado', 'espera' => $wait]); }
  $pw = (string)(body()['pw'] ?? '');
  if ($pw !== '' && password_verify($pw, (string)$auth['hash'])) {
    unset($all[$k]); wj($af, $all);
    session_regenerate_id(true);
    $_SESSION['adm'] = 1; $_SESSION['t'] = time(); $_SESSION['csrf'] = bin2hex(random_bytes(16));
    out(200, ['ok' => true, 'csrf' => $_SESSION['csrf'], 'brands' => rj(PRIV . '/brands.json', new stdClass)]);
  }
  $mine[] = $now; $all[$k] = $mine; foreach ($all as $kk => $v) { $v = array_values(array_filter($v, fn($t) => $t > $now - 900)); if (!$v) unset($all[$kk]); else $all[$kk] = $v; } wj($af, $all);
  usleep(700000); out(401, ['error' => 'clave']);
}
if ($a === 'logout' && $method === 'POST') { $_SESSION = []; session_destroy(); out(200, ['ok' => true]); }
if ($a === 'save' && $method === 'POST') {
  need_admin(true); $in = body();
  try { $data = clean_data($in['data'] ?? null); } catch (Exception $e) { out(400, ['error' => 'formato']); }
  $brands = clean_brands($in['brands'] ?? []);
  $prev = rj(DATA, null);
  if ($prev) snapshot($prev, rj(PRIV . '/brands.json', new stdClass));
  if (!wj(DATA, $data) || !wj(PRIV . '/brands.json', $brands)) out(500, ['error' => 'no_se_pudo_escribir']);
  out(200, ['ok' => true, 'data' => $data, 't' => time()]);
}
if ($a === 'backups') {
  need_admin(); $l = [];
  foreach (glob(PRIV . '/backups/*.json') ?: [] as $f) $l[] = ['id' => 'b:' . basename($f, '.json'), 't' => (int)(rj($f)['t'] ?? filemtime($f)), 'size' => filesize($f), 'kind' => 'b'];
  foreach (glob(PRIV . '/backups/daily/*.json') ?: [] as $f) $l[] = ['id' => 'd:' . basename($f, '.json'), 't' => (int)(rj($f)['t'] ?? filemtime($f)), 'size' => filesize($f), 'kind' => 'd'];
  usort($l, fn($x, $y) => $y['t'] <=> $x['t']); out(200, ['list' => array_slice($l, 0, 150)]);
}
if ($a === 'restore' && $method === 'POST') {
  need_admin(true); $f = backup_path((string)(body()['id'] ?? ''));
  if (!$f) out(404, ['error' => 'no_existe']);
  $snap = rj($f, null); if (!$snap || !isset($snap['data'])) out(500, ['error' => 'copia_danada']);
  $cur = rj(DATA, null); if ($cur) { $dir = PRIV . '/backups'; @mkdir($dir, 0750, true); file_put_contents($dir . '/' . date('Ymd-His') . '.json', json_encode(['t' => time(), 'data' => $cur, 'brands' => rj(PRIV . '/brands.json', new stdClass)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX); }
  try { $data = clean_data($snap['data']); } catch (Exception $e) { out(500, ['error' => 'copia_danada']); }
  $brands = clean_brands($snap['brands'] ?? []);
  wj(DATA, $data); wj(PRIV . '/brands.json', $brands);
  out(200, ['ok' => true, 'data' => $data, 'brands' => $brands]);
}
if ($a === 'backup') { // descarga de una copia completa
  need_admin(); if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_GET['t'] ?? ''))) out(403, ['error' => 'csrf']);
  header('Content-Type: application/octet-stream'); $stamp = date('Ymd-His');
  if (class_exists('ZipArchive')) {
    $tmp = tempnam(sys_get_temp_dir(), 'cp'); $z = new ZipArchive();
    if ($z->open($tmp, ZipArchive::OVERWRITE) === true) {
      $z->addFile(DATA, 'data.json'); if (is_file(PRIV . '/brands.json')) $z->addFile(PRIV . '/brands.json', 'brands.json');
      foreach (glob(IMGS . '/*.*') ?: [] as $f) if (preg_match('/\.(jpg|png|webp)$/', $f)) $z->addFile($f, 'img/' . basename($f));
      $z->close(); header('Content-Disposition: attachment; filename="copia-' . $stamp . '.zip"'); header('Content-Length: ' . filesize($tmp)); readfile($tmp); @unlink($tmp); exit;
    }
  }
  header('Content-Disposition: attachment; filename="copia-' . $stamp . '.json"');
  echo json_encode(['data' => rj(DATA), 'brands' => rj(PRIV . '/brands.json', new stdClass)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}
if ($a === 'setpw' && $method === 'POST') {
  need_admin(true); $in = body(); $auth = rj(PRIV . '/auth.json', null);
  if (!$auth || !password_verify((string)($in['old'] ?? ''), (string)$auth['hash'])) { usleep(700000); out(401, ['error' => 'clave']); }
  $new = (string)($in['new'] ?? ''); if (strlen($new) < 8) out(400, ['error' => 'corta']);
  wj(PRIV . '/auth.json', ['hash' => password_hash($new, PASSWORD_DEFAULT), 'changed' => time()]);
  session_regenerate_id(true); out(200, ['ok' => true]);
}
out(404, ['error' => 'no']);

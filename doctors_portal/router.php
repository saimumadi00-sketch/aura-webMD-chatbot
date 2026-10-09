<?php
/* Router for PHP's development server: deny legacy public uploads and internal helpers. */
// REQUEST_URI is a request path; parse_url would misread //uploads as a host.
$path = rawurldecode(explode('?', $_SERVER['REQUEST_URI'] ?? '/', 2)[0]);
$path = preg_replace('~/+~', '/', $path);
if (str_contains($path, '..') || str_contains($path, '\\') || str_contains($path, "\0") || preg_match('~^/(?:uploads(?:/|$)|(?:config|session|storage|validation|router)\.php(?:/|$)|schema\.sql(?:/|$)|admin/_(?:auth|header|footer)\.php(?:/|$))~i', $path)) {
    http_response_code(403);
    exit('Access denied.');
}
return false;

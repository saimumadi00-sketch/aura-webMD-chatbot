<?php
/* Pure form validation can be tested without a database or web server. */
function validate_booking(string $name, string $email, string $phone, string $date, string $time, string $reason): string {
    if ($name === '') return 'Your name is required.';
    if (strlen($name) > 200 || strlen($email) > 254 || strlen($phone) > 50 || strlen($reason) > 5000) return 'One or more fields exceed the allowed length.';
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) return 'Enter a valid email address.';
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) return 'Enter a valid appointment date.';
    if (!preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/D', $time)) return 'Enter a valid appointment time.';
    $slot = DateTimeImmutable::createFromFormat(strlen($time) === 5 ? '!Y-m-d H:i' : '!Y-m-d H:i:s', $date . ' ' . $time);
    if (!$slot || $slot <= new DateTimeImmutable()) return 'Choose a future appointment date and time.';
    return '';
}

<?php
header("Access-Control-Allow-Origin: *");

header("Access-Control-Allow-Headers: Content-Type");

header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); // No content
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data["firstName"]) || !isset($data["lastName"])) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

$file = 'students.json';
$students = [];

if (file_exists($file)) {
    $students = json_decode(file_get_contents($file), true);
    if (!is_array($students)) $students = [];
}


$students[] = $data;

file_put_contents($file, json_encode($students, JSON_PRETTY_PRINT));

echo json_encode(["success" => true, "student" => $data]);
?>

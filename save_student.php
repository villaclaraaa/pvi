<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);


$firstName = trim($data["firstName"]);
$lastName = trim($data["lastName"]);

if (empty($firstName) || empty($lastName)) {
    echo json_encode(["success" => false, "message" => "Invalid input: firstName and lastName cannot be empty"]);
    exit;
}

if (!preg_match("/^[a-zA-Z\p{Cyrillic}\s'-]+$/u", $firstName) || !preg_match("/^[a-zA-Z\p{Cyrillic}\s'-]+$/u", $lastName)) {
    echo json_encode(["success" => false, "message" => "Invalid input: firstName and lastName can only contain letters, spaces, hyphens, and apostrophes"]);
    exit;
}

require_once 'StudentModel.php';
$model = new StudentModel();

$savedStudent = $model->saveStudent($data); 

if ($savedStudent) {
    echo json_encode(["success" => true, "student" => $savedStudent]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to save student"]);
}
?>
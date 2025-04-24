<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Validate
if (!isset($data["id"])) {
    echo json_encode(["success" => false, "message" => "Student ID is required"]);
    exit;
}

require_once 'StudentModel.php';
$model = new StudentModel();

if ($model->updateStudent($data)) {
    echo json_encode(["success" => true, "message" => "Student updated", "student" => $data]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update student or student not found"]);
}
?>
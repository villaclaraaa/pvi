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

if (!is_array($data) || empty($data)) {
    echo json_encode(["success" => false, "message" => "Invalid input. Expected array of IDs."]);
    exit;
}

require_once 'StudentModel.php';
$model = new StudentModel();

if ($model->deleteStudents($data)) {
    echo json_encode(["success" => true, "message" => "Students deleted"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete students"]);
}
?>
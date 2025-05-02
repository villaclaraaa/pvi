<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit;
}


require_once 'StudentModel.php';
$model = new StudentModel();

if (!$model->conn) {
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$students = $model->getAllStudents();

echo json_encode($students);

?>
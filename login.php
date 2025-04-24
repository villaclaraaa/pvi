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

if (!isset($data['login']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Login and password are required']);
    exit;
}

$login = $data['login'];
$password = $data['password'];

require_once 'StudentModel.php';  // Include the Model
$model = new StudentModel();

$student = $model->findStudentByLogin($login);

if (!$student) {
    echo json_encode(['success' => false, 'message' => 'Wrong login']);
} elseif ($student['gender'] == $password) {
    echo json_encode(['success' => true, 'username' => $login]);
} else {
    echo json_encode(['success' => false, 'message' => 'Wrong password']);
}
?>
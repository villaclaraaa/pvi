<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if($_SERVER['REQUEST_METHOD'] == 'POST')
{
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!isset($data["id"]) || !is_numeric($data["id"]) || $data["id"] <= 0) {
        echo json_encode(["success" => false, "message" => "Invalid student ID"]);
        exit;
    }

    if (!isset($data["firstName"]) || !isset($data["lastName"])) {
        echo json_encode(["success" => false, "message" => "firstName and lastName are required for update"]);
        exit;
    }

    $firstName = trim($data["firstName"]);
    $lastName = trim($data["lastName"]);

    if (empty($firstName) || empty($lastName)) {
        echo json_encode(["success" => false, "message" => "firstName and lastName cannot be empty"]);
        exit;
    }

    if (!preg_match("/^[a-zA-Z\p{Cyrillic}\s'-]+$/u", $firstName) || !preg_match("/^[a-zA-Z\p{Cyrillic}\s'-]+$/u", $lastName)) {
        echo json_encode(["success" => false, "message" => "firstName and lastName can only contain letters, spaces, hyphens, and apostrophes"]);
        exit;
    }

    require_once 'StudentModel.php';
    $model = new StudentModel();

    if ($model->updateStudent($data)) {
        echo json_encode(["success" => true, "message" => "Student updated", "student" => $data]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update student or student not found"]);
    }
}
?>
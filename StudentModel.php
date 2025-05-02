<?php
class StudentModel {
    public $conn;
    private $db_host = 'localhost';
    private $db_user = 'root';
    private $db_pass = '';
    private $db_name = 'students_db';

    public function __construct() {
        $this->conn = new mysqli(
            $this->db_host,
            $this->db_user,
            $this->db_pass,
            $this->db_name
        );

        if ($this->conn->connect_error) {
            die("Database connection failed: " . $this->conn->connect_error);
        }
        
    }

    public function getAllStudents() {
        $sql = "SELECT * FROM students";
        $result = $this->conn->query($sql);
        if (!$result) {  
            error_log("Query failed: " . $this->conn->error);
            return false;
        }
        $students = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $students[] = $row;
            }
        }
        error_log("getAllStudents result: " . print_r($students, true));
        return $students;
    }

    public function saveStudent($studentData) {
        $group = $this->conn->real_escape_string($studentData['group'] ?? '');
        $firstName = $this->conn->real_escape_string($studentData['firstName']);
        $lastName = $this->conn->real_escape_string($studentData['lastName']);
        $gender = $this->conn->real_escape_string($studentData['gender'] ?? '');
        $birth = $this->conn->real_escape_string($studentData['birth'] ?? '');
    

        $checkSql = "SELECT id FROM students WHERE firstName = '$firstName' AND lastName = '$lastName'";
        $checkResult = $this->conn->query($checkSql);

        if ($checkResult && $checkResult->num_rows > 0) {
            error_log("Attempted to save a duplicate student: " . $firstName . " " . $lastName);
            return false; 
        }

        $sql = "INSERT INTO students (`group`, `firstName`, `lastName`, `gender`, `birth`)
                VALUES ('$group', '$firstName', '$lastName', '$gender', '$birth')";
    
        if ($this->conn->query($sql) === TRUE) {
            $studentData['id'] = $this->conn->insert_id;
            return $studentData;
        } else {
            error_log("saveStudent query failed: " . $this->conn->error . " - SQL: " . $sql);
            return false;
        }
    }

    public function deleteStudents($ids) {
        $idList = implode(',', array_map(function ($id) {
            return intval($id);
        }, $ids));

        $sql = "DELETE FROM students WHERE id IN ($idList)";

        if ($this->conn->query($sql) === TRUE) {
            return true;
        } else {
            error_log("deleteStudents query failed: " . $this->conn->error);  // Log the error
            return false;
        }
    }

    public function updateStudent($studentData) {
        $id = intval($studentData['id']);
        $group = $this->conn->real_escape_string($studentData['group'] ?? '');
        $firstName = $this->conn->real_escape_string($studentData['firstName']);
        $lastName = $this->conn->real_escape_string($studentData['lastName']);
        $gender = $this->conn->real_escape_string($studentData['gender'] ?? '');
        $birth = $this->conn->real_escape_string($studentData['birth'] ?? '');
    
        $sql = "UPDATE students SET
                    `group` = '$group',
                    `firstName` = '$firstName',
                    `lastName` = '$lastName',
                    `gender` = '$gender',
                    `birth` = '$birth'  
                    WHERE `id` = $id";  
    
        if ($this->conn->query($sql) === TRUE) {
            return true;
        } else {
             error_log("updateStudent query failed: " . $this->conn->error . " - SQL: " . $sql);  // Log the SQL
            return false;
        }
    }

    public function findStudentByLogin($login) {
        $sql = "SELECT * FROM students WHERE CONCAT(firstName, ' ', lastName) = '$login'";
        $result = $this->conn->query($sql);
        if (!$result) {
            error_log("findStudentByLogin query failed: " . $this->conn->error);
            return false;  
        }
        if ($result->num_rows == 1) {
            return $result->fetch_assoc();
        } else {
            return null;
        }
    }

    public function __destruct() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
}
?>
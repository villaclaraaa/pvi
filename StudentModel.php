<?php
class StudentModel {
    private $file = 'students.json';

    public function __construct($file_path = 'students.json') {
        $this->file = $file_path;
    }


    public function findStudentByLogin($login) {
        $students = $this->getAllStudents();  // Assuming you have getAllStudents()
        foreach ($students as $student) {
            if ($student['firstName'] . ' ' . $student['lastName'] == $login) {
                return $student;
            }
        }
        return null;
    }
    
    public function getAllStudents() {
        if (file_exists($this->file)) {
            $data = file_get_contents($this->file);
            $students = json_decode($data, true);
            return is_array($students) ? $students : [];
        } else {
            return [];
        }
    }

    public function saveStudent($studentData) {
        $students = $this->getAllStudents();
        $students[] = $studentData;
        return file_put_contents($this->file, json_encode($students, JSON_PRETTY_PRINT));
    }

    public function deleteStudents($ids) {
        $students = $this->getAllStudents();
        $updatedStudents = array_filter($students, function ($student) use ($ids) {
            return !in_array($student["id"], $ids);
        });
        return file_put_contents($this->file, json_encode(array_values($updatedStudents), JSON_PRETTY_PRINT));
    }

    public function updateStudent($studentData) {
        $students = $this->getAllStudents();
        $found = false;
        foreach ($students as &$student) {
            if ($student["id"] == $studentData["id"]) {
                $student["group"] = $studentData["group"];
                $student["firstName"] = $studentData["firstName"];
                $student["lastName"] = $studentData["lastName"];
                $student["gender"] = $studentData["gender"];
                $student["birth"] = $studentData["birth"];
                $found = true;
                break;
            }
        }
        if (!$found) {
            return false; // Indicate student not found
        }
        return file_put_contents($this->file, json_encode($students, JSON_PRETTY_PRINT));
    }
}
?>
<?php
ob_start();

$fName = filter_input(INPUT_GET, 
                     'file',
                     FILTER_SANITIZE_STRING, 
                     FILTER_FLAG_ENCODE_HIGH|FILTER_FLAG_ENCODE_LOW);

$file = $_SERVER['DOCUMENT_ROOT'] . '/leaflet/json/'. $fName .'.json';

if (file_exists($file)) {
    header('Content-Type: application/json');
    header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
    header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
    
    readfile($file);
    ob_end_flush();
    exit;
} else {
    header("HTTP/1.1 404 Not Found");
}




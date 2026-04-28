import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    original_activities = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original_activities)


@pytest.fixture
def client():
    return TestClient(app)


def test_get_activities_returns_activity_payload(client):
    # Arrange
    expected_activity_name = "Chess Club"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert expected_activity_name in data
    assert isinstance(data[expected_activity_name]["participants"], list)
    assert data[expected_activity_name]["description"] == "Learn strategies and compete in chess tournaments"


def test_signup_adds_participant(client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "test.student@mergington.edu"
    url = f"/activities/{quote(activity_name)}/signup?email={quote(participant_email)}"

    # Act
    response = client.post(url)

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {participant_email} for {activity_name}"
    assert participant_email in activities[activity_name]["participants"]


def test_duplicate_signup_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    existing_student = "michael@mergington.edu"
    url = f"/activities/{quote(activity_name)}/signup?email={quote(existing_student)}"

    # Act
    response = client.post(url)

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_remove_participant_removes_student(client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "michael@mergington.edu"
    url = f"/activities/{quote(activity_name)}/participants?email={quote(participant_email)}"

    # Act
    response = client.delete(url)

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant_email} from {activity_name}"
    assert participant_email not in activities[activity_name]["participants"]


def test_remove_missing_participant_returns_404(client):
    # Arrange
    activity_name = "Chess Club"
    participant_email = "doesnotexist@mergington.edu"
    url = f"/activities/{quote(activity_name)}/participants?email={quote(participant_email)}"

    # Act
    response = client.delete(url)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"

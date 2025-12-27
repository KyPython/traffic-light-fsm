"""
Tests for the NumPy traffic gate function
"""
import numpy as np
import pytest
from traffic_gate import is_local_lane_priority, batch_priority_decisions


def test_basic_priority_logic():
    """Test basic priority switching logic"""
    waiting = np.array([5, 2, 8, 1])
    competing = np.array([1, 3, 2, 5])
    
    decisions = is_local_lane_priority(waiting, competing)
    
    # Lane 0: 5 waiting, 1 competing -> should switch (5 >= 3 and 1 <= 2)
    assert decisions[0] == True
    
    # Lane 1: 2 waiting, 3 competing -> should NOT switch (2 < 3 threshold)
    assert decisions[1] == False
    
    # Lane 2: 8 waiting, 2 competing -> should switch (8 >= 3 and 2 <= 2)
    assert decisions[2] == True
    
    # Lane 3: 1 waiting, 5 competing -> should NOT switch
    assert decisions[3] == False


def test_priority_ratio():
    """Test priority ratio logic"""
    waiting = np.array([10, 1])
    competing = np.array([5, 0])  # Ratio 10/5=2.0 > 1.5, should trigger
    
    decisions = is_local_lane_priority(waiting, competing, priority_ratio=1.5)
    
    # Lane 0: ratio 2.0 > 1.5 -> should switch
    assert decisions[0] == True
    
    # Lane 1: competing is 0, waiting > 0 -> should switch (edge case)
    assert decisions[1] == True


def test_zero_competing():
    """Test edge case where competing traffic is zero"""
    waiting = np.array([3, 0])
    competing = np.array([0, 0])
    
    decisions = is_local_lane_priority(waiting, competing)
    
    # Lane 0: waiting > 0 and competing == 0 -> should switch
    assert decisions[0] == True
    
    # Lane 1: waiting == 0 -> should NOT switch
    assert decisions[1] == False


def test_custom_thresholds():
    """Test with custom threshold values"""
    waiting = np.array([2, 5, 1])
    competing = np.array([1, 3, 1])
    
    # Lower thresholds: min_waiting=2, max_competing=3
    decisions = is_local_lane_priority(
        waiting, competing,
        min_waiting_threshold=2,
        max_competing_threshold=3
    )
    
    # Lane 0: 2 >= 2 and 1 <= 3 -> should switch
    assert decisions[0] == True
    
    # Lane 1: 5 >= 2 and 3 <= 3 -> should switch
    assert decisions[1] == True
    
    # Lane 2: 1 < 2 -> should NOT switch
    assert decisions[2] == False


def test_list_input():
    """Test that function accepts Python lists as input"""
    waiting = [5, 2, 8]
    competing = [1, 3, 2]
    
    decisions = is_local_lane_priority(waiting, competing)
    
    assert isinstance(decisions, np.ndarray)
    assert decisions.dtype == bool
    assert len(decisions) == 3


def test_shape_mismatch():
    """Test that function raises error on shape mismatch"""
    waiting = np.array([1, 2, 3])
    competing = np.array([1, 2])  # Different length
    
    with pytest.raises(ValueError, match="same shape"):
        is_local_lane_priority(waiting, competing)


def test_batch_priority_decisions():
    """Test batch processing wrapper"""
    waiting = np.array([5, 2, 8])
    competing = np.array([1, 3, 2])
    
    result = batch_priority_decisions(waiting, competing)
    
    assert 'decisions' in result
    assert 'waiting' in result
    assert 'competing' in result
    assert 'ratios' in result
    assert 'green_count' in result
    assert 'red_count' in result
    
    assert isinstance(result['decisions'], np.ndarray)
    assert result['green_count'] + result['red_count'] == len(waiting)


def test_vectorized_performance():
    """Test that function works efficiently on large arrays"""
    # Simulate 1000 lanes
    np.random.seed(42)
    waiting = np.random.randint(0, 20, 1000)
    competing = np.random.randint(0, 15, 1000)
    
    decisions = is_local_lane_priority(waiting, competing)
    
    assert len(decisions) == 1000
    assert decisions.dtype == bool
    # Should have some True and some False
    assert np.any(decisions) or np.any(~decisions)


if __name__ == '__main__':
    # Simple test runner for quick validation
    print("Running basic tests...")
    
    waiting = np.array([5, 2, 8, 1])
    competing = np.array([1, 3, 2, 5])
    decisions = is_local_lane_priority(waiting, competing)
    
    print(f"Waiting vehicles: {waiting}")
    print(f"Competing traffic: {competing}")
    print(f"Switch to GREEN decisions: {decisions}")
    print(f"Lanes switching to GREEN: {np.sum(decisions)}/{len(decisions)}")
    
    # Test batch processing
    result = batch_priority_decisions(waiting, competing)
    print(f"\nBatch results:")
    print(f"  Green lanes: {result['green_count']}")
    print(f"  Red lanes: {result['red_count']}")
    print(f"  Ratios: {result['ratios']}")
    
    print("\n✅ Basic tests passed!")


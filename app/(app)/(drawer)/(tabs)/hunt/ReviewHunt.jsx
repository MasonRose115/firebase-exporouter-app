import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Alert,
  ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PageHeader from '../../../../../components/PageHeader';
import { 
  getCurrentUser, 
  getReviewsByUser, 
  createReview, 
  updateReview 
} from '../../../../../lib/firebase-service';

// Star Rating Component
function StarRating({ rating, onRatingChange, editable = true }) {
  const stars = [1, 2, 3, 4, 5];
  
  const handleStarPress = (star) => {
    console.log('Star pressed:', star);
    if (editable && onRatingChange) {
      onRatingChange(star);
    }
  };
  
  return (
    <View style={styles.starContainer}>
      {stars.map(star => (
        <Pressable
          key={star}
          style={[styles.star, !editable && styles.starDisabled]}
          onPress={() => handleStarPress(star)}
          disabled={!editable}
        >
          <Text style={[
            styles.starText,
            star <= rating ? styles.starFilled : styles.starEmpty
          ]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ReviewHunt() {
  const router = useRouter();
  const { huntId, huntName, isEdit } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const isEditMode = isEdit === 'true';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        const uid = user?.user?.uid;
        if (!uid) {
          setError('You must be signed in to review hunts.');
          return;
        }
        
        setCurrentUser(user.user);

        // If in edit mode, fetch existing review
        if (isEditMode) {
          const userReviews = await getReviewsByUser(uid);
          const huntReview = userReviews.find(review => review.huntId === huntId);
          
          if (huntReview) {
            setExistingReview(huntReview);
            setRating(huntReview.rating);
            setComment(huntReview.comment || '');
          } else {
            setError('Review not found.');
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load review data:', e);
        setError('Failed to load review data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [huntId, isEditMode]);

  const handleSave = async () => {
    console.log('HandleSave called - Rating:', rating, 'Comment:', comment);
    
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating from 1 to 5 stars.');
      return;
    }

    setSaving(true);
    console.log('Starting save process...');
    
    try {
      const reviewData = {
        huntId: String(huntId), // Ensure huntId is string
        userId: currentUser.uid,
        rating: Number(rating), // Ensure rating is number
        comment: comment.trim()
      };

      console.log('Review data to save:', reviewData);

      if (isEditMode && existingReview) {
        console.log('Updating existing review:', existingReview.reviewId);
        // Update existing review
        await updateReview(existingReview.reviewId, {
          rating: Number(rating),
          comment: comment.trim()
        });
        console.log('Review updated successfully');
        Alert.alert('Success', 'Review updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        console.log('Creating new review');
        // Create new review
        const reviewId = await createReview(reviewData);
        console.log('Review created successfully with ID:', reviewId);
        Alert.alert('Success', 'Review submitted successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      console.error('Failed to save review:', e);
      Alert.alert('Error', `Failed to save review: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Review Hunt" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader title="Review Hunt" />
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.button} onPress={handleCancel}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title={isEditMode ? "Edit Review" : "Add Review"} 
        subtitle={huntName} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Hunt Info */}
          <View style={styles.huntInfo}>
            <Text style={styles.huntLabel}>Hunt:</Text>
            <Text style={styles.huntName}>{huntName}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating *</Text>
            <Text style={styles.sectionSubtitle}>How would you rate this hunt?</Text>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating} 
              editable={true}
            />
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating} star{rating !== 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <Text style={styles.sectionSubtitle}>
              Share your thoughts about this hunt (optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              multiline={true}
              numberOfLines={6}
              placeholder="Tell other hunters about your experience..."
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, styles.cancelButton]} 
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </Pressable>
        
        <Pressable 
          style={[
            styles.button, 
            styles.saveButton,
            (saving || rating === 0) && styles.disabledButton
          ]} 
          onPress={() => {
            console.log('Save button pressed - Rating:', rating, 'Saving:', saving);
            if (!saving && rating > 0) {
              handleSave();
            } else {
              console.log('Button press ignored - saving:', saving, 'rating:', rating);
            }
          }}
          disabled={saving || rating === 0}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isEditMode ? 'Update Review' : 'Submit Review'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  huntInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  huntLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  huntName: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  star: {
    marginHorizontal: 4,
    padding: 8,
  },
  starDisabled: {
    opacity: 0.6,
  },
  starText: {
    fontSize: 32,
    textAlign: 'center',
  },
  starFilled: {
    color: '#fbbf24',
  },
  starEmpty: {
    color: '#d1d5db',
  },
  ratingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButtonText: {
    color: '#374151',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  error: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
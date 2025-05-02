// src/lib/utils/storageUtils.ts
import { supabase } from '../supabase';

/**
 * Creates RLS policies for a storage bucket to allow public access
 * @param bucketName The name of the bucket to create policies for
 * @returns A promise that resolves when the policies are created
 */
const createRLSPolicies = async (bucketName: string): Promise<boolean> => {
  try {
    // Try the first method
    try {
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: bucketName
      });

      if (policyError) {
        console.error('Error creating RLS policy with create_storage_policy:', policyError);
        throw policyError;
      }
    } catch (error) {
      // Try the second method
      try {
        const { error: enableError } = await supabase.rpc('enable_bucket_rls', {
          bucket_name: bucketName
        });

        if (enableError) {
          console.error('Error creating RLS policy with enable_bucket_rls:', enableError);
          throw enableError;
        }
      } catch (enableError) {
        // If both methods fail, try the direct SQL approach
        try {
          // Create direct policies using SQL
          const { error: directPolicyError } = await supabase.rpc('create_direct_upload_policy', {
            bucket_name: bucketName,
            file_path: '*' // Wildcard for all files
          });

          if (directPolicyError) {
            console.error('Error creating direct policy:', directPolicyError);
            return false;
          }
        } catch (directError) {
          console.error('Error creating direct policy:', directError);
          return false;
        }
      }
    }

    console.log(`RLS policies created for bucket "${bucketName}"`);
    return true;
  } catch (error) {
    console.error('Error creating RLS policies:', error);
    return false;
  }
};

/**
 * Ensures that a storage bucket exists, creating it if necessary
 * @param bucketName The name of the bucket to ensure exists
 * @param isPublic Whether the bucket should be public (default: true)
 * @returns A promise that resolves with a boolean indicating whether the bucket exists
 */
export const ensureBucketExists = async (bucketName: string, isPublic: boolean = true): Promise<boolean> => {
  try {
    // First check if the bucket exists
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();

    if (getBucketsError) {
      console.error('Error checking buckets:', getBucketsError);
      return false;
    }

    // Check if our bucket exists
    const bucketExists = buckets && buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" does not exist. Creating...`);

      try {
        // Create the bucket
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 10485760 // 10MB
        });

        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);

          // Try to create the bucket directly using SQL
          try {
            const { error: directError } = await supabase.rpc('create_bucket_direct', {
              bucket_name: bucketName,
              is_public: isPublic
            });

            if (directError) {
              console.error('Error creating bucket directly:', directError);
              return false;
            }

            console.log(`Bucket "${bucketName}" created directly via SQL.`);
            return true;
          } catch (directError) {
            console.error('Error in direct bucket creation:', directError);
            return false;
          }
        }

        console.log(`Bucket "${bucketName}" created successfully.`);

        // Create RLS policies for the bucket
        const policiesCreated = await createRLSPolicies(bucketName);
        if (!policiesCreated) {
          console.warn('RLS policies could not be created, but bucket exists. Uploads may fail due to permissions.');
        }
      } catch (error) {
        console.error('Error in bucket creation process:', error);
        return false;
      }
    } else {
      console.log(`Bucket "${bucketName}" already exists.`);
    }

    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};

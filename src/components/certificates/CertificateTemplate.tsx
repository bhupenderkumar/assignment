// src/components/certificates/CertificateTemplate.tsx
import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Circle, Line, Group, Image } from 'react-konva';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { InteractiveSubmission } from '../../types/interactiveAssignment';

interface CertificateTemplateProps {
  submission: InteractiveSubmission;
  assignmentTitle?: string;
  width?: number;
  height?: number;
  onExport?: (dataUrl: string) => void;
}

const CertificateTemplate = ({
  submission,
  assignmentTitle,
  width = 800,
  height = 600,
  onExport
}: CertificateTemplateProps) => {
  const stageRef = useRef<any>(null);
  const { config } = useConfiguration();
  const { username } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const [sealImage, setSealImage] = useState<HTMLImageElement | null>(null);
  const [signatureImage, setSignatureImage] = useState<HTMLImageElement | null>(null);

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get achievement text based on score
  const getAchievementText = (score?: number | null) => {
    const actualScore = score === null || score === undefined ? 0 : score;

    if (actualScore >= 90) return "Outstanding Achievement";
    if (actualScore >= 70) return "Excellent Performance";
    if (actualScore >= 50) return "Successful Completion";
    return "Participation and Effort";
  };

  // Generate certificate ID
  const certificateId = `CERT-${submission.id.substring(0, 8).toUpperCase()}`;

  // Load seal image
  useEffect(() => {
    const image = new window.Image();
    image.src = '/assets/images/certificate-seal.png';
    image.onload = () => {
      setSealImage(image);
    };
    image.onerror = () => {
      console.log('Error loading seal image');
    };
  }, []);

  // Load signature image if organization has one
  useEffect(() => {
    if (currentOrganization?.signatureUrl) {
      const image = new window.Image();
      image.src = currentOrganization.signatureUrl;
      image.onload = () => {
        setSignatureImage(image);
      };
      image.onerror = () => {
        console.log('Error loading signature image');
      };
    }
  }, [currentOrganization]);

  // Export certificate as image
  useEffect(() => {
    if (stageRef.current && onExport && sealImage) {
      // Add a small delay to ensure the stage is fully rendered
      const timer = setTimeout(() => {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        onExport(dataUrl);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [sealImage, signatureImage, onExport]);

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Create rgba string
  const rgba = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="certificate-container">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
      >
        <Layer>
          {/* Background with subtle gradient */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: width, y: height }}
            fillLinearGradientColorStops={[0, '#ffffff', 1, '#f8f9fa']}
          />

          {/* Decorative background pattern */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Circle
              key={`bg-circle-${i}`}
              x={Math.random() * width}
              y={Math.random() * height}
              radius={Math.random() * 30 + 10}
              fill={rgba(config.primaryColor, 0.03)}
            />
          ))}

          {/* Border */}
          <Rect
            x={20}
            y={20}
            width={width - 40}
            height={height - 40}
            stroke={config.primaryColor}
            strokeWidth={5}
            dash={[15, 10]}
            cornerRadius={10}
          />

          {/* Inner border - adjusted for better padding */}
          <Rect
            x={50}
            y={50}
            width={width - 100}
            height={height - 100}
            stroke={config.accentColor}
            strokeWidth={2}
            cornerRadius={5}
          />

          {/* Certificate Header with shadow effect */}
          <Text
            x={width / 2}
            y={80}
            text="Certificate of Achievement"
            fontSize={38}
            fontStyle="bold"
            fill={config.primaryColor}
            align="center"
            width={width}
            offsetX={width / 2}
            shadowColor={rgba(config.primaryColor, 0.2)}
            shadowBlur={5}
            shadowOffset={{ x: 2, y: 2 }}
            fontFamily="Arial, sans-serif"
          />

          {/* Achievement Type with decorative elements */}
          <Group>
            <Line
              points={[width / 2 - 120, 125, width / 2 - 20, 125]}
              stroke={rgba(config.secondaryColor, 0.5)}
              strokeWidth={1}
            />

            <Text
              x={width / 2}
              y={125}
              text={getAchievementText(submission.score)}
              fontSize={22}
              fontStyle="italic"
              fill={config.secondaryColor}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />

            <Line
              points={[width / 2 + 20, 125, width / 2 + 120, 125]}
              stroke={rgba(config.secondaryColor, 0.5)}
              strokeWidth={1}
            />
          </Group>

          {/* Decorative line with gradient */}
          <Rect
            x={width / 2 - 150}
            y={155}
            width={300}
            height={3}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 300, y: 0 }}
            fillLinearGradientColorStops={[
              0, rgba(config.accentColor, 0.1),
              0.5, config.accentColor,
              1, rgba(config.accentColor, 0.1)
            ]}
            cornerRadius={1.5}
          />

          {/* Certificate Body */}
          <Text
            x={width / 2}
            y={185}
            text="This certificate is proudly presented to"
            fontSize={18}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Georgia, serif"
          />

          <Text
            x={width / 2}
            y={225}
            text={username || 'Dedicated Learner'}
            fontSize={30}
            fontStyle="bold"
            fill={config.secondaryColor}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Arial, sans-serif"
            shadowColor={rgba(config.secondaryColor, 0.2)}
            shadowBlur={3}
            shadowOffset={{ x: 1, y: 1 }}
          />

          {/* Decorative underline for name */}
          <Line
            points={[width / 2 - 150, 245, width / 2 + 150, 245]}
            stroke={rgba(config.secondaryColor, 0.3)}
            strokeWidth={1}
            dash={[1, 2]}
          />

          <Text
            x={width / 2}
            y={275}
            text="for successfully completing"
            fontSize={18}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Georgia, serif"
          />

          <Text
            x={width / 2}
            y={315}
            text={assignmentTitle || 'Interactive Assignment'}
            fontSize={26}
            fontStyle="bold"
            fill={config.accentColor}
            align="center"
            width={width}
            offsetX={width / 2}
            fontFamily="Arial, sans-serif"
            shadowColor={rgba(config.accentColor, 0.2)}
            shadowBlur={3}
            shadowOffset={{ x: 1, y: 1 }}
          />

          {/* Assignment details in a decorative box */}
          <Group>
            <Rect
              x={width / 2 - 150}
              y={345}
              width={300}
              height={60}
              fill={rgba(config.primaryColor, 0.05)}
              stroke={rgba(config.primaryColor, 0.2)}
              strokeWidth={1}
              cornerRadius={5}
            />

            <Text
              x={width / 2}
              y={360}
              text={`Assignment Type: ${submission.assignmentType || 'Interactive Exercise'}`}
              fontSize={16}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />

            <Text
              x={width / 2}
              y={385}
              text={`Difficulty Level: ${submission.difficultyLevel?.charAt(0).toUpperCase() + submission.difficultyLevel?.slice(1) || 'Standard'}`}
              fontSize={16}
              align="center"
              width={width}
              offsetX={width / 2}
              fontFamily="Georgia, serif"
            />
          </Group>

          {/* Score section with improved layout - positioned lower */}
          <Group>
            {/* Score label and value in a horizontal layout */}
            <Group x={width / 2 - 150} y={470}>
              <Text
                text="With a score of:"
                fontSize={20}
                fontStyle="italic"
                fill={config.secondaryColor}
                align="right"
                width={150}
                fontFamily="Georgia, serif"
              />
            </Group>

            {/* Score Circle with decorative elements */}
            <Group x={width / 2 + 80} y={470}>
              {/* Outer decorative circle */}
              <Circle
                radius={45}
                stroke={rgba(config.primaryColor, 0.3)}
                strokeWidth={2}
                dash={[2, 2]}
              />

              {/* Main score circle */}
              <Circle
                radius={40}
                fill={submission.score && submission.score > 0 ? config.primaryColor : config.secondaryColor}
                shadowColor="rgba(0,0,0,0.2)"
                shadowBlur={10}
                shadowOffset={{ x: 3, y: 3 }}
              />

              {/* Centered percentage text */}
              <Text
                text={`${submission.score !== undefined && submission.score !== null ? submission.score : 0}%`}
                fontSize={26}
                fontStyle="bold"
                fill="white"
                align="center"
                width={80}
                offsetX={40}
                offsetY={13}
                fontFamily="Arial, sans-serif"
              />
            </Group>

            {/* Decorative line connecting the elements */}
            <Line
              points={[width / 2 - 140, 490, width / 2 + 140, 490]}
              stroke={rgba(config.accentColor, 0.2)}
              strokeWidth={1}
              dash={[3, 3]}
            />
          </Group>

          {/* Certificate Footer with improved styling - moved up to avoid touching bottom */}
          <Group x={120} y={height - 100}>
            <Line
              points={[0, 0, 120, 0]}
              stroke={rgba(config.primaryColor, 0.5)}
              strokeWidth={1}
            />
            <Text
              y={10}
              text={`Date: ${formatDate(submission.submittedAt)}`}
              fontSize={14}
              fill="#555"
              fontFamily="Georgia, serif"
            />
          </Group>

          {/* Certificate ID with improved seal - moved up */}
          <Group x={width / 2} y={height - 100}>
            {sealImage && (
              <Group>
                {/* Background glow for seal */}
                <Circle
                  radius={30}
                  fill={rgba(config.primaryColor, 0.1)}
                  x={0}
                  y={-15}
                />
                <Image
                  image={sealImage}
                  width={50}
                  height={50}
                  offsetX={25}
                  offsetY={-15}
                  opacity={0.9}
                />
              </Group>
            )}
            <Text
              y={10}
              text={`Certificate ID: ${certificateId}`}
              fontSize={14}
              fill="#555"
              align="center"
              width={200}
              offsetX={100}
              fontFamily="Georgia, serif"
            />
          </Group>

          {/* Organization signature - moved up and adjusted to stay within boundaries */}
          <Group x={width - 180} y={height - 100}>
            <Line
              points={[-80, 0, 0, 0]}
              stroke={rgba(config.primaryColor, 0.5)}
              strokeWidth={1}
            />
            {signatureImage ? (
              <Group>
                <Image
                  image={signatureImage}
                  width={100}
                  height={40}
                  offsetX={50}
                  offsetY={-20}
                  opacity={0.9}
                />
                <Text
                  y={10}
                  text={currentOrganization?.name || "Instructor Signature"}
                  fontSize={13}
                  fill="#555"
                  align="right"
                  width={80}
                  fontFamily="Georgia, serif"
                />
              </Group>
            ) : (
              <Text
                y={10}
                text="Instructor Signature"
                fontSize={13}
                fill="#555"
                align="right"
                width={80}
                fontFamily="Georgia, serif"
              />
            )}
          </Group>

          {/* Enhanced decorative corners - adjusted to match inner border */}
          <Group>
            {/* Top left */}
            <Group>
              <Line
                points={[50, 50, 50, 100, 100, 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={50}
                y={50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Top right */}
            <Group>
              <Line
                points={[width - 50, 50, width - 50, 100, width - 100, 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={width - 50}
                y={50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Bottom left */}
            <Group>
              <Line
                points={[50, height - 50, 50, height - 100, 100, height - 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={50}
                y={height - 50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>

            {/* Bottom right */}
            <Group>
              <Line
                points={[width - 50, height - 50, width - 50, height - 100, width - 100, height - 50]}
                stroke={rgba(config.accentColor, 0.4)}
                strokeWidth={3}
              />
              <Circle
                x={width - 50}
                y={height - 50}
                radius={5}
                fill={rgba(config.primaryColor, 0.5)}
              />
            </Group>
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default CertificateTemplate;

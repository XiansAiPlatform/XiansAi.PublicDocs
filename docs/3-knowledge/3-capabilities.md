# Capabilities as Knowledge

While [capabilities](../1-getting-started/3-adding-capabilities.md) can be defined directly in code using attributes, Xians provides a more flexible way to manage capability descriptions through the portal using knowledge items. This approach allows you to modify capability descriptions without requiring code changes and redeployment.

## Knowledge-Based Capability Descriptions

Capability descriptions can be managed as knowledge items in the portal, following a specific JSON structure:

```json
{
  "description": "Detailed description of what the capability does",
  "returns": "Description of what the capability returns",
  "parameters": {
    "parameterName1": "Description of parameter 1",
    "parameterName2": "Description of parameter 2"
  }
}
```

### Knowledge Item Structure

- `description`: A clear explanation of what the capability does
- `returns`: Description of the return value or outcome
- `parameters`: An object containing parameter names and their descriptions

## Linking Knowledge to Capabilities

To link a knowledge item to a capability, use the `[Knowledge]` attribute in your code:

```csharp
[Knowledge("Your Capability Name")]
public async Task<string> YourCapabilityMethod(
    string parameter1,
    string parameter2)
{
    // Implementation
}
```

The knowledge item name in the `[Knowledge]` attribute should match the name of the knowledge item created in the portal.

## Example

Here's a complete example of a capability with its corresponding knowledge item:

Name of the knowledge item: `Capability - Upload pre-assessment`

```json
// Knowledge Item in Portal
{
  "description": "Create a patient ticket for summarization workflow. Confirm with the user before proceeding.",
  "returns": "Confirmation message indicating that the patient ticket creation has been initiated",
  "parameters": {
    "patientName": "Patient's full name (first and last name)",
    "appointmentNumber": "Patient's appointment number",
    "patientAge": "Patient's age",
    "complaint": "Primary complaint of the patient",
    "symptomsDetails": "Details of the patient's symptoms",
    "medicalHistory": "Patient's medical history",
    "medicationsAndAllergies": "Details of medications and allergies",
    "lifestyleContext": "Lifestyle and other contextual information"
  }
}
```

```csharp
// Code Implementation
[Knowledge("Capability - Upload pre-assessment")]
public async Task<string> UploadPreAssessment(
    string patientName,
    string appointmentNumber,
    int patientAge,
    string complaint,
    string symptomsDetails,
    string medicationsAndAllergies)
{
    // Implementation
}
```

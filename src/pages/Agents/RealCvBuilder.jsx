import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, FileText, Mail, Plus, CheckCircle, Lightbulb, Info } from 'lucide-react'

export default function CVBuilder() {
  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedin: ''
  })

  // CV Content State
  const [cvRole, setCvRole] = useState('general')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  
  // Dynamic Entries State
  const [experiences, setExperiences] = useState([])
  const [education, setEducation] = useState([])
  const [certifications, setCertifications] = useState([])
  
  // Cover Letter State
  const [coverRole, setCoverRole] = useState('general')
  const [coverText, setCoverText] = useState('')
  
  // Feedback State
  const [feedbacks, setFeedbacks] = useState({})
  const [loadingStates, setLoadingStates] = useState({})
  const [appliedStates, setAppliedStates] = useState({})

  // Track manual changes to prevent auto-analysis after applying suggestions
  const manualChanges = useRef({
    summary: false,
    skills: false,
    cover: false,
    experiences: {},
    education: {},
    certifications: {}
  })

  // Counters for unique IDs
  const [expCounter, setExpCounter] = useState(0)
  const [eduCounter, setEduCounter] = useState(0)
  const [certCounter, setCertCounter] = useState(0)

  const timeouts = useRef({});

  // Debounced analysis function
  const analyzeText = useCallback(async (fieldId, text, role, type) => {
    if (!text.trim() || !manualChanges.current[fieldId]) {
      setFeedbacks(prev => ({ ...prev, [fieldId]: null }))
      return
    }

    setLoadingStates(prev => ({ ...prev, [fieldId]: true }))
    setAppliedStates(prev => ({ ...prev, [fieldId]: false }))

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role, type })
      })
      
      const data = await response.json()
      setFeedbacks(prev => ({ ...prev, [fieldId]: data }))
    } catch (error) {
      setFeedbacks(prev => ({ 
        ...prev, 
        [fieldId]: { 
          feedback: 'Error analyzing text', 
          suggestion: '', 
          additional_suggestions: [], 
          formatted: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setLoadingStates(prev => ({ ...prev, [fieldId]: false }))
      manualChanges.current[fieldId] = false // Reset after analysis
    }
  }, [])

  // Handle text changes and track manual edits
  const handleTextChange = (fieldId, value, setter, type) => {
    setter(value);
    manualChanges.current[fieldId] = true;
    const role = type === 'cover' ? coverRole : cvRole;
    
    // Clear any existing timeout for this field
    if (timeouts.current[fieldId]) {
      clearTimeout(timeouts.current[fieldId]);
    }
    
    // Set new timeout for analysis
    timeouts.current[fieldId] = setTimeout(() => {
      analyzeText(fieldId, value, role, type);
    }, 600);
  };

  // Debounced effect for analysis
  useEffect(() => {
    const timeouts = {}

    const scheduleAnalysis = (fieldId, text, role, type) => {
      if (timeouts[fieldId]) clearTimeout(timeouts[fieldId])
      timeouts[fieldId] = setTimeout(() => {
        analyzeText(fieldId, text, role, type)
      }, 600)
    }

    // Only analyze if there was a manual change
    if (manualChanges.current.summary && summary) {
      scheduleAnalysis('summary', summary, cvRole, 'summary')
    }
    
    if (manualChanges.current.skills && skills) {
      scheduleAnalysis('skills', skills, cvRole, 'skills')
    }
    
    if (manualChanges.current.cover && coverText) {
      scheduleAnalysis('cover', coverText, coverRole, 'cover')
    }

    experiences.forEach(exp => {
      const fieldId = `exp-${exp.id}`
      if (manualChanges.current.experiences[exp.id] && exp.bullets) {
        scheduleAnalysis(fieldId, exp.bullets, cvRole, 'experience')
      }
    })

    education.forEach(edu => {
      const fieldId = `edu-${edu.id}`
      if (manualChanges.current.education[edu.id] && edu.details) {
        scheduleAnalysis(fieldId, edu.details, cvRole, 'education')
      }
    })

    return () => {
      Object.values(timeouts).forEach(clearTimeout)
    }
  }, [summary, skills, coverText, experiences, education, cvRole, coverRole, analyzeText])

  // Apply suggestion function
  const applySuggestion = (fieldId, content, targetSetter) => {
    targetSetter(content)
    setAppliedStates(prev => ({ ...prev, [fieldId]: true }))
    // Clear the feedback immediately
    setFeedbacks(prev => ({ ...prev, [fieldId]: null }))
    // Don't set manualChanges to true here to prevent re-analysis
    setTimeout(() => {
      setAppliedStates(prev => ({ ...prev, [fieldId]: false }))
    }, 2000)
  }

  // Dynamic entry management
  const addExperience = () => {
    const newId = expCounter + 1
    setExpCounter(newId)
    setExperiences(prev => [...prev, { id: newId, title: '', company: '', dates: '', bullets: '' }])
    manualChanges.current.experiences[newId] = false
  }

  const updateExperience = (id, field, value) => {
    setExperiences(prev => prev.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
    if (field === 'bullets') {
      manualChanges.current.experiences[id] = true
    }
  }

  const addEducation = () => {
    const newId = eduCounter + 1
    setEduCounter(newId)
    setEducation(prev => [...prev, { id: newId, degree: '', school: '', dates: '', details: '' }])
    manualChanges.current.education[newId] = false
  }

  const updateEducation = (id, field, value) => {
    setEducation(prev => prev.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
    if (field === 'details') {
      manualChanges.current.education[id] = true
    }
  }

  const addCertification = () => {
    const newId = certCounter + 1
    setCertCounter(newId)
    setCertifications(prev => [...prev, { id: newId, name: '', issuer: '', date: '' }])
  }

  const updateCertification = (id, field, value) => {
    setCertifications(prev => prev.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    ))
  }

  // Generate CV Preview
  const generatePreview = () => {
    let html = ''
    
    if (personalInfo.name) html += `<h2 class="text-2xl font-bold text-blue-600 mb-2">${personalInfo.name}</h2>`
    if (personalInfo.headline) html += `<h4 class="text-lg font-semibold text-gray-700 mb-3">${personalInfo.headline}</h4>`
    
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean)
    if (contact.length) html += `<p class="text-sm text-gray-600 mb-4">${contact.join(' | ')}</p>`
    
    if (summary) html += `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Professional Summary</h3><p class="text-gray-700 mb-4">${summary.replace(/\n/g, '<br>')}</p>`
    
    if (experiences.length > 0) {
      html += `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Work Experience</h3>`
      experiences.forEach(exp => {
        if (exp.title || exp.company || exp.dates || exp.bullets) {
          html += `<h4 class="font-semibold text-gray-800">${exp.title} at ${exp.company}, ${exp.dates}</h4>`
          if (exp.bullets) {
            html += '<ul class="list-disc list-inside text-gray-700 mb-3">' + 
              exp.bullets.split('\n').map(b => b.trim() ? `<li>${b}</li>` : '').join('') + 
              '</ul>'
          }
        }
      })
    }
    
    if (education.length > 0) {
      html += `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Education</h3>`
      education.forEach(edu => {
        if (edu.degree || edu.school || edu.dates || edu.details) {
          html += `<h4 class="font-semibold text-gray-800">${edu.degree}, ${edu.school}, ${edu.dates}</h4>`
          if (edu.details) {
            html += '<ul class="list-disc list-inside text-gray-700 mb-3">' + 
              edu.details.split('\n').map(d => d.trim() ? `<li>${d}</li>` : '').join('') + 
              '</ul>'
          }
        }
      })
    }
    
    if (skills) {
      html += `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Skills</h3><ul class="list-disc list-inside text-gray-700 mb-4">` + 
        skills.split('\n').map(s => s.trim() ? `<li>${s}</li>` : '').join('') + 
        `</ul>`
    }
    
    if (certifications.length > 0) {
      html += `<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">Certifications</h3>`
      certifications.forEach(cert => {
        if (cert.name || cert.issuer || cert.date) {
          html += `<p class="text-gray-700">${cert.name}, ${cert.issuer}, ${cert.date}</p>`
        }
      })
    }
    
    return html
  }

  // Feedback Component
  const FeedbackPanel = ({ fieldId, onApply }) => {
    const feedback = feedbacks[fieldId]
    const isLoading = loadingStates[fieldId]
    const isApplied = appliedStates[fieldId]

    if (isApplied) {
      return (
        <Card className="mt-3 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-semibold">Applied successfully!</span>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (isLoading) {
      return (
        <Card className="mt-3">
          <CardContent className="p-4 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Analyzing...</p>
          </CardContent>
        </Card>
      )
    }

    if (!feedback) return null

    return (
      <Card className="mt-3 border-blue-200 bg-blue-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start">
            <Info className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">Feedback:</p>
              <p className="text-gray-700 text-sm">{feedback.feedback}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold text-gray-800">Suggestion:</p>
              <p className="text-green-700 text-sm italic">{feedback.suggestion}</p>
            </div>
          </div>

          {feedback.additional_suggestions && feedback.additional_suggestions.length > 0 && (
            <div>
              <p className="font-semibold text-gray-800 mb-2">Additional Suggestions:</p>
              <ul className="space-y-1">
                {feedback.additional_suggestions.map((sug, idx) => (
                  <li key={idx} className="text-xs bg-green-100 p-2 rounded text-green-800">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">Formatted:</p>
              <p className="text-blue-700 text-sm font-medium">{feedback.formatted}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={() => onApply(feedback.formatted)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Formatted
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onApply(feedback.suggestion)}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Apply Suggestion
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r  text-blue-500 rounded-t-lg">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <FileText className="w-8 h-8" />
              Professional CV & Cover Letter Builder
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <Tabs defaultValue="cv" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="cv" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CV Builder
                </TabsTrigger>
                <TabsTrigger value="cover" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Cover Letter Builder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cv">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* CV Editor Panel */}
                  <div className="space-y-6">
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Role/Sector:
                          </label>
                          <Input
                            value={cvRole}
                            onChange={(e) => setCvRole(e.target.value)}
                            placeholder="e.g., Software Engineer"
                            className="border-gray-300"
                          />
                        </div>

                        <Accordion type="multiple" defaultValue={["personal"]} className="space-y-4">
                          <AccordionItem value="personal">
                            <AccordionTrigger className="text-lg font-semibold">
                              Personal Information
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3">
                              <Input
                                value={personalInfo.name}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Full Name"
                              />
                              <Input
                                value={personalInfo.headline}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, headline: e.target.value }))}
                                placeholder="Professional Headline (e.g., Senior Software Engineer)"
                              />
                              <Input
                                value={personalInfo.email}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                              />
                              <Input
                                value={personalInfo.phone}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone"
                              />
                              <Input
                                value={personalInfo.location}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Location (e.g., City, State)"
                              />
                              <Input
                                value={personalInfo.linkedin}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="LinkedIn URL"
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="summary">
                            <AccordionTrigger className="text-lg font-semibold">
                              Professional Summary
                            </AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                value={summary}
                                onChange={(e) => handleTextChange('summary', e.target.value, setSummary, 'summary')}
                                placeholder="Write your professional summary here..."
                                className="min-h-[150px] resize-y"
                              />
                              <FeedbackPanel 
                                fieldId="summary" 
                                onApply={(content) => applySuggestion('summary', content, setSummary)}
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="experience">
                            <AccordionTrigger className="text-lg font-semibold">
                              Work Experience
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <Button onClick={addExperience} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Job
                              </Button>
                              {experiences.map((exp) => (
                                <Card key={exp.id} className="p-4 bg-gray-50 hover:shadow-md transition-shadow">
                                  <div className="space-y-3">
                                    <Input
                                      value={exp.title}
                                      onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                                      placeholder="Job Title"
                                    />
                                    <Input
                                      value={exp.company}
                                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                      placeholder="Company"
                                    />
                                    <Input
                                      value={exp.dates}
                                      onChange={(e) => updateExperience(exp.id, 'dates', e.target.value)}
                                      placeholder="Dates (e.g., June 2019 - Present)"
                                    />
                                    <Textarea
                                      value={exp.bullets}
                                      onChange={(e) => {
                                        manualChanges.current.experiences[exp.id] = true;
                                        updateExperience(exp.id, 'bullets', e.target.value);
                                      }}
                                      placeholder="Bullets (one per line)"
                                      className="min-h-[100px]"
                                    />
                                    <FeedbackPanel 
                                      fieldId={`exp-${exp.id}`} 
                                      onApply={(content) => applySuggestion(`exp-${exp.id}`, content, (value) => updateExperience(exp.id, 'bullets', value))}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="education">
                            <AccordionTrigger className="text-lg font-semibold">
                              Education
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <Button onClick={addEducation} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Education
                              </Button>
                              {education.map((edu) => (
                                <Card key={edu.id} className="p-4 bg-gray-50 hover:shadow-md transition-shadow">
                                  <div className="space-y-3">
                                    <Input
                                      value={edu.degree}
                                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                      placeholder="Degree"
                                    />
                                    <Input
                                      value={edu.school}
                                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                      placeholder="School/University"
                                    />
                                    <Input
                                      value={edu.dates}
                                      onChange={(e) => updateEducation(edu.id, 'dates', e.target.value)}
                                      placeholder="Dates"
                                    />
                                    <Textarea
                                      value={edu.details}
                                      onChange={(e) => {
                                        manualChanges.current.education[edu.id] = true;
                                        updateEducation(edu.id, 'details', e.target.value);
                                      }}
                                      placeholder="Details/Achievements (optional)"
                                      className="min-h-[80px]"
                                    />
                                    <FeedbackPanel 
                                      fieldId={`edu-${edu.id}`} 
                                      onApply={(content) => applySuggestion(`edu-${edu.id}`, content, (value) => updateEducation(edu.id, 'details', value))}
                                    />
                                  </div>
                                </Card>
                              ))}
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="skills">
                            <AccordionTrigger className="text-lg font-semibold">
                              Skills
                            </AccordionTrigger>
                            <AccordionContent>
                              <Textarea
                                value={skills}
                                onChange={(e) => handleTextChange('skills', e.target.value, setSkills, 'skills')}
                                placeholder="List skills, one per line..."
                                className="min-h-[120px]"
                              />
                              <FeedbackPanel 
                                fieldId="skills" 
                                onApply={(content) => applySuggestion('skills', content, setSkills)}
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="certifications">
                            <AccordionTrigger className="text-lg font-semibold">
                              Certifications
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <Button onClick={addCertification} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Certification
                              </Button>
                              {certifications.map((cert) => (
                                <Card key={cert.id} className="p-4 bg-gray-50 hover:shadow-md transition-shadow">
                                  <div className="space-y-3">
                                    <Input
                                      value={cert.name}
                                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                                      placeholder="Certification Name"
                                    />
                                    <Input
                                      value={cert.issuer}
                                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                                      placeholder="Issuer"
                                    />
                                    <Input
                                      value={cert.date}
                                      onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                                      placeholder="Date"
                                    />
                                  </div>
                                </Card>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </div>

                  {/* CV Preview Panel */}
                  <div className="space-y-6">
                    <Card className="h-fit">
                      <CardHeader>
                        <CardTitle className="text-xl">CV Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: generatePreview() }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cover">
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                  {/* Cover Letter Editor */}
                  <div className="lg:col-span-4">
                    <Card className="bg-gray-50">
                      <CardContent className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Role/Sector:
                          </label>
                          <Input
                            value={coverRole}
                            onChange={(e) => setCoverRole(e.target.value)}
                            placeholder="e.g., Marketing Manager"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Cover Letter Text:
                          </label>
                          <Textarea
                            value={coverText}
                            onChange={(e) => handleTextChange('cover', e.target.value, setCoverText, 'cover')}
                            placeholder="Enter your cover letter here...&#10;Example:&#10;Dear Hiring Manager,&#10;I am excited to apply for the position..."
                            className="min-h-[400px] resize-y"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cover Letter Feedback */}
                  <div className="lg:col-span-3">
                    <FeedbackPanel 
                      fieldId="cover" 
                      onApply={(content) => applySuggestion('cover', content, setCoverText)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, FileText, Mail, Plus, CheckCircle, Lightbulb, Info, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Custom components for Markdown rendering
const components = {
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-700 mb-3">{children}</ul>,
  li: ({ children }) => <li>{children}</li>,
  p: ({ children }) => <p className="text-gray-700 mb-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
}

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
  const [skills, setSkills] = useState([])

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
    skills: {},
    cover: false,
    experiences: {},
    education: {},
    certifications: {}
  })

  // Counters for unique IDs
  const [expCounter, setExpCounter] = useState(0)
  const [eduCounter, setEduCounter] = useState(0)
  const [certCounter, setCertCounter] = useState(0)

  const timeouts = useRef({})

  // Replace placeholders in Markdown content
  const replacePlaceholders = (markdown) => {
    if (!markdown || typeof markdown !== 'string') return 'No content available.'
    return markdown
      .replace(/\[Your Name\]/g, personalInfo.name || 'Candidate')
      .replace(/\[Recipient's Name\]/g, 'Hiring Manager')
  }

  // Debounced analysis function
  const analyzeText = useCallback(async (fieldId, text, role, type) => {
    if (!text.trim()) {
      setFeedbacks(prev => ({ ...prev, [fieldId]: null }))
      return
    }

    setLoadingStates(prev => ({ ...prev, [fieldId]: true }))
    setAppliedStates(prev => ({ ...prev, [fieldId]: false }))

    try {
      const response = await fetch('https://triumphant-perception-production.up.railway.app/cv/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, role, type })
      })

      const data = await response.json()
      setFeedbacks(prev => ({
        ...prev,
        [fieldId]: {
          ...data,
          feedback: replacePlaceholders(data.feedback),
          suggestion: replacePlaceholders(data.suggestion),
          formatted: replacePlaceholders(data.formatted),
          additional_suggestions: data.additional_suggestions?.map(sug => replacePlaceholders(sug)) || []
        }
      }))
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
      if (fieldId.startsWith('exp-')) {
        const [, expId, , bulletIdx] = fieldId.split('-')
        manualChanges.current.experiences[expId] = manualChanges.current.experiences[expId] || {}
        manualChanges.current.experiences[expId][bulletIdx] = false
      } else if (fieldId.startsWith('edu-')) {
        const [, eduId, , detailIdx] = fieldId.split('-')
        manualChanges.current.education[eduId] = manualChanges.current.education[eduId] || {}
        manualChanges.current.education[eduId][detailIdx] = false
      } else if (fieldId.startsWith('skill-')) {
        const [, skillIdx] = fieldId.split('-')
        manualChanges.current.skills[skillIdx] = false
      } else {
        manualChanges.current[fieldId] = false
      }
    }
  }, [personalInfo.name])

  // Handle text changes for string fields
  const handleTextChange = (fieldId, value, setter, type) => {
    setter(value)
    manualChanges.current[fieldId] = true
    const role = type === 'cover' ? coverRole : cvRole

    if (timeouts.current[fieldId]) {
      clearTimeout(timeouts.current[fieldId])
    }

    timeouts.current[fieldId] = setTimeout(() => {
      analyzeText(fieldId, value, role, type)
    }, 600)
  }

  // Functions for experiences
  const addExperience = () => {
    const newId = expCounter + 1
    setExpCounter(newId)
    setExperiences(prev => [...prev, { id: newId, title: '', company: '', dates: '', bullets: [] }])
    manualChanges.current.experiences[newId] = {}
  }

  const updateExperience = (id, field, value) => {
    setExperiences(prev => prev.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const addBulletToExp = (id) => {
    setExperiences(prev => prev.map(exp =>
      exp.id === id ? { ...exp, bullets: [...exp.bullets, ''] } : exp
    ))
  }

  const updateExpBullet = (id, idx, value) => {
    setExperiences(prev => prev.map(exp =>
      exp.id === id ? { ...exp, bullets: exp.bullets.map((b, i) => i === idx ? value : b) } : exp
    ))
    const fieldId = `exp-${id}-bullet-${idx}`
    manualChanges.current.experiences[id] = manualChanges.current.experiences[id] || {}
    manualChanges.current.experiences[id][idx] = true
    const role = cvRole
    if (timeouts.current[fieldId]) {
      clearTimeout(timeouts.current[fieldId])
    }
    timeouts.current[fieldId] = setTimeout(() => {
      analyzeText(fieldId, value, role, 'experience')
    }, 600)
  }

  const removeExpBullet = (id, idx) => {
    setExperiences(prev => prev.map(exp =>
      exp.id === id ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== idx) } : exp
    ))
    const fieldId = `exp-${id}-bullet-${idx}`
    delete manualChanges.current.experiences[id][idx]
    setFeedbacks(prev => {
      const newFeedbacks = { ...prev }
      delete newFeedbacks[fieldId]
      return newFeedbacks
    })
    setLoadingStates(prev => {
      const newLoading = { ...prev }
      delete newLoading[fieldId]
      return newLoading
    })
  }

  // Functions for education
  const addEducation = () => {
    const newId = eduCounter + 1
    setEduCounter(newId)
    setEducation(prev => [...prev, { id: newId, degree: '', school: '', dates: '', details: [] }])
    manualChanges.current.education[newId] = {}
  }

  const updateEducation = (id, field, value) => {
    setEducation(prev => prev.map(edu =>
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const addDetailToEdu = (id) => {
    setEducation(prev => prev.map(edu =>
      edu.id === id ? { ...edu, details: [...edu.details, ''] } : edu
    ))
  }

  const updateEduDetail = (id, idx, value) => {
    setEducation(prev => prev.map(edu =>
      edu.id === id ? { ...edu, details: edu.details.map((d, i) => i === idx ? value : d) } : edu
    ))
    const fieldId = `edu-${id}-detail-${idx}`
    manualChanges.current.education[id] = manualChanges.current.education[id] || {}
    manualChanges.current.education[id][idx] = true
    const role = cvRole
    if (timeouts.current[fieldId]) {
      clearTimeout(timeouts.current[fieldId])
    }
    timeouts.current[fieldId] = setTimeout(() => {
      analyzeText(fieldId, value, role, 'education')
    }, 600)
  }

  const removeEduDetail = (id, idx) => {
    setEducation(prev => prev.map(edu =>
      edu.id === id ? { ...edu, details: edu.details.filter((_, i) => i !== idx) } : edu
    ))
    const fieldId = `edu-${id}-detail-${idx}`
    delete manualChanges.current.education[id][idx]
    setFeedbacks(prev => {
      const newFeedbacks = { ...prev }
      delete newFeedbacks[fieldId]
      return newFeedbacks
    })
    setLoadingStates(prev => {
      const newLoading = { ...prev }
      delete newLoading[fieldId]
      return newLoading
    })
  }

  // Functions for skills
  const addSkill = () => {
    setSkills([...skills, ''])
    manualChanges.current.skills[skills.length] = false
  }

  const updateSkill = (idx, value) => {
    setSkills(prev => prev.map((s, i) => i === idx ? value : s))
    const fieldId = `skill-${idx}`
    manualChanges.current.skills[idx] = true
    const role = cvRole
    if (timeouts.current[fieldId]) {
      clearTimeout(timeouts.current[fieldId])
    }
    timeouts.current[fieldId] = setTimeout(() => {
      analyzeText(fieldId, value, role, 'skills')
    }, 600)
  }

  const removeSkill = (idx) => {
    setSkills(prev => prev.filter((_, i) => i !== idx))
    const fieldId = `skill-${idx}`
    delete manualChanges.current.skills[idx]
    setFeedbacks(prev => {
      const newFeedbacks = { ...prev }
      delete newFeedbacks[fieldId]
      return newFeedbacks
    })
    setLoadingStates(prev => {
      const newLoading = { ...prev }
      delete newLoading[fieldId]
      return newLoading
    })
  }

  // Functions for certifications
  const addCertification = () => {
    const newId = certCounter + 1
    setCertCounter(newId)
    setCertifications(prev => [...prev, { id: newId, name: '', issuer: '', date: '' }])
    manualChanges.current.certifications[newId] = false
  }

  const updateCertification = (id, field, value) => {
    setCertifications(prev => prev.map(cert =>
      cert.id === id ? { ...cert, [field]: value } : cert
    ))
  }

  // Debounced effect for analysis (excluding skills)
  useEffect(() => {
    const timeouts = {}

    const scheduleAnalysis = (fieldId, text, role, type) => {
      if (timeouts[fieldId]) clearTimeout(timeouts[fieldId])
      timeouts[fieldId] = setTimeout(() => {
        analyzeText(fieldId, text, role, type)
      }, 600)
    }

    // Summary and cover
    if (manualChanges.current.summary && summary.trim()) {
      scheduleAnalysis('summary', summary, cvRole, 'summary')
    }

    if (manualChanges.current.cover && coverText.trim()) {
      scheduleAnalysis('cover', coverText, coverRole, 'cover')
    }

    // Experiences
    experiences.forEach(exp => {
      exp.bullets.forEach((bullet, idx) => {
        const fieldId = `exp-${exp.id}-bullet-${idx}`
        if (manualChanges.current.experiences[exp.id]?.[idx] && bullet.trim()) {
          scheduleAnalysis(fieldId, bullet, cvRole, 'experience')
        }
      })
    })

    // Education
    education.forEach(edu => {
      edu.details.forEach((detail, idx) => {
        const fieldId = `edu-${edu.id}-detail-${idx}`
        if (manualChanges.current.education[edu.id]?.[idx] && detail.trim()) {
          scheduleAnalysis(fieldId, detail, cvRole, 'education')
        }
      })
    })

    return () => {
      Object.values(timeouts).forEach(clearTimeout)
    }
  }, [summary, coverText, experiences, education, cvRole, coverRole, analyzeText])

  // Apply content function
  const applyContent = (fieldId, content) => {
    if (fieldId === 'summary') {
      setSummary(content)
    } else if (fieldId === 'cover') {
      setCoverText(content)
    } else if (fieldId.startsWith('skill-')) {
      const [, skillIdx] = fieldId.split('-')
      const idx = parseInt(skillIdx)
      setSkills(prev => prev.map((s, i) => i === idx ? content.replace(/^- /, '').trim() : s))
    } else if (fieldId.startsWith('exp-')) {
      const [, expId, , bulletIdx] = fieldId.split('-')
      const id = parseInt(expId)
      const idx = parseInt(bulletIdx)
      setExperiences(prev => prev.map(exp =>
        exp.id === id ? { ...exp, bullets: exp.bullets.map((b, i) => i === idx ? content.replace(/^- /, '').trim() : b) } : exp
      ))
    } else if (fieldId.startsWith('edu-')) {
      const [, eduId, , detailIdx] = fieldId.split('-')
      const id = parseInt(eduId)
      const idx = parseInt(detailIdx)
      setEducation(prev => prev.map(edu =>
        edu.id === id ? { ...edu, details: edu.details.map((d, i) => i === idx ? content.replace(/^- /, '').trim() : d) } : edu
      ))
    }

    setAppliedStates(prev => ({ ...prev, [fieldId]: true }))
    setFeedbacks(prev => ({ ...prev, [fieldId]: null }))

    if (fieldId.startsWith('exp-')) {
      const [, expId, , bulletIdx] = fieldId.split('-')
      manualChanges.current.experiences[expId] = manualChanges.current.experiences[expId] || {}
      manualChanges.current.experiences[expId][bulletIdx] = false
    } else if (fieldId.startsWith('edu-')) {
      const [, eduId, , detailIdx] = fieldId.split('-')
      manualChanges.current.education[eduId] = manualChanges.current.education[eduId] || {}
      manualChanges.current.education[eduId][detailIdx] = false
    } else if (fieldId.startsWith('skill-')) {
      const [, skillIdx] = fieldId.split('-')
      manualChanges.current.skills[skillIdx] = false
    } else {
      manualChanges.current[fieldId] = false
    }

    setTimeout(() => {
      setAppliedStates(prev => ({ ...prev, [fieldId]: false }))
    }, 2000)
  }

  // Generate CV Preview
  const generatePreview = () => {
    let header = ''
    if (personalInfo.name) header += `## ${personalInfo.name}\n`
    if (personalInfo.headline) header += `### ${personalInfo.headline}\n`
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin].filter(Boolean)
    if (contact.length) header += `${contact.join(' | ')}\n`

    return (
      <div className="prose prose-sm max-w-none">
        {header && <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{replacePlaceholders(header)}</ReactMarkdown>}

        {summary && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Professional Summary</h3>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{replacePlaceholders(summary)}</ReactMarkdown>
          </>
        )}

        {experiences.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Work Experience</h3>
            {experiences.map((exp, index) => {
              if (exp.title || exp.company || exp.dates || exp.bullets.length > 0) {
                return (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-800">{exp.title} at {exp.company}, {exp.dates}</h4>
                    {exp.bullets.length > 0 && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {exp.bullets.map(b => `- ${replacePlaceholders(b)}`).join('\n')}
                      </ReactMarkdown>
                    )}
                  </div>
                )
              }
              return null
            })}
          </>
        )}

        {education.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Education</h3>
            {education.map((edu, index) => {
              if (edu.degree || edu.school || edu.dates || edu.details.length > 0) {
                return (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-800">{edu.degree}, {edu.school}, {edu.dates}</h4>
                    {edu.details.length > 0 && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {edu.details.map(d => `- ${replacePlaceholders(d)}`).join('\n')}
                      </ReactMarkdown>
                    )}
                  </div>
                )
              }
              return null
            })}
          </>
        )}

        {skills.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Skills</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-gray-700 mb-4">
              {skills.map((s, i) => (
                <div key={i} className="flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{replacePlaceholders(s)}</ReactMarkdown>
                </div>
              ))}
            </div>
          </>
        )}

        {certifications.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Certifications</h3>
            {certifications.map((cert, index) => {
              if (cert.name || cert.issuer || cert.date) {
                return (
                  <p key={index} className="text-gray-700">{cert.name}, {cert.issuer}, {cert.date}</p>
                )
              }
              return null
            })}
          </>
        )}
      </div>
    )
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
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{feedback.feedback}</ReactMarkdown>
            </div>
          </div>

          <div className="flex items-start">
            <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
            <div>
              <p className="font-semibold text-gray-800">Suggestion:</p>
              <div className="text-green-700 text-sm italic"> <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} >{feedback.suggestion}</ReactMarkdown></div>
             
            </div>
          </div>

          {feedback.additional_suggestions && feedback.additional_suggestions.length > 0 && (
            <div>
              <p className="font-semibold text-gray-800 mb-2">Additional Suggestions:</p>
              <ul className="space-y-1">
                {feedback.additional_suggestions.map((sug, idx) => (
                  <li key={idx} className="text-xs bg-green-100 p-2 rounded text-green-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{sug}</ReactMarkdown>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-800">Formatted:</p>
              <div className="text-blue-700 text-sm font-medium"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components} >{feedback.formatted}</ReactMarkdown></div>
              
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
          <CardHeader className="text-center bg-gradient-to-r text-blue-500 rounded-t-lg">
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
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <Input
                                value={personalInfo.headline}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, headline: e.target.value }))}
                                placeholder="Professional Headline (e.g., Senior Software Engineer)"
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <Input
                                value={personalInfo.email}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <Input
                                value={personalInfo.phone}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Phone"
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <Input
                                value={personalInfo.location}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Location (e.g., City, State)"
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <Input
                                value={personalInfo.linkedin}
                                onChange={(e) => setPersonalInfo(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="LinkedIn URL"
                                className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                placeholder="Write your professional summary here... (e.g., **MERN stack developer** with expertise in...) "
                                className="min-h-[150px] resize-y border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                              />
                              <FeedbackPanel
                                fieldId="summary"
                                onApply={(content) => applyContent('summary', content)}
                              />
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="experience">
                            <AccordionTrigger className="text-lg font-semibold">
                              Work Experience
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <Button onClick={addExperience} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
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
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={exp.company}
                                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                      placeholder="Company"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={exp.dates}
                                      onChange={(e) => updateExperience(exp.id, 'dates', e.target.value)}
                                      placeholder="Dates (e.g., June 2019 - Present)"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="space-y-4">
                                      {exp.bullets.map((bullet, idx) => (
                                        <div key={idx} className="space-y-2">
                                          <div className="flex items-end gap-2">
                                            <Textarea
                                              value={bullet}
                                              onChange={(e) => updateExpBullet(exp.id, idx, e.target.value)}
                                              placeholder="Enter bullet point... (e.g., - Developed **responsive web applications**...)"
                                              className="min-h-[60px] resize-y border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                                            />
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => removeExpBullet(exp.id, idx)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          <FeedbackPanel
                                            fieldId={`exp-${exp.id}-bullet-${idx}`}
                                            onApply={(content) => applyContent(`exp-${exp.id}-bullet-${idx}`, content)}
                                          />
                                        </div>
                                      ))}
                                      <Button
                                        onClick={() => addBulletToExp(exp.id)}
                                        variant="secondary"
                                        className="w-full flex items-center gap-2"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Bullet Point
                                      </Button>
                                    </div>
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
                              <Button onClick={addEducation} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
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
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={edu.school}
                                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                      placeholder="School/University"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={edu.dates}
                                      onChange={(e) => updateEducation(edu.id, 'dates', e.target.value)}
                                      placeholder="Dates"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="space-y-4">
                                      {edu.details.map((detail, idx) => (
                                        <div key={idx} className="space-y-2">
                                          <div className="flex items-end gap-2">
                                            <Textarea
                                              value={detail}
                                              onChange={(e) => updateEduDetail(edu.id, idx, e.target.value)}
                                              placeholder="Enter detail/achievement... (e.g., - Graduated with **honors**...)"
                                              className="min-h-[60px] resize-y border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                                            />
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => removeEduDetail(edu.id, idx)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          <FeedbackPanel
                                            fieldId={`edu-${edu.id}-detail-${idx}`}
                                            onApply={(content) => applyContent(`edu-${edu.id}-detail-${idx}`, content)}
                                          />
                                        </div>
                                      ))}
                                      <Button
                                        onClick={() => addDetailToEdu(edu.id)}
                                        variant="secondary"
                                        className="w-full flex items-center gap-2"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Detail
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="skills">
                            <AccordionTrigger className="text-lg font-semibold">
                              Skills
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              {skills.map((skill, idx) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={skill}
                                      onChange={(e) => updateSkill(idx, e.target.value)}
                                      placeholder="Enter skill... (e.g., **JavaScript**)"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeSkill(idx)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <FeedbackPanel
                                    fieldId={`skill-${idx}`}
                                    onApply={(content) => applyContent(`skill-${idx}`, content)}
                                  />
                                </div>
                              ))}
                              <Button
                                onClick={addSkill}
                                variant="secondary"
                                className="w-full flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Add Skill
                              </Button>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="certifications">
                            <AccordionTrigger className="text-lg font-semibold">
                              Certifications
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <Button onClick={addCertification} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
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
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={cert.issuer}
                                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                                      placeholder="Issuer"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Input
                                      value={cert.date}
                                      onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                                      placeholder="Date"
                                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        {generatePreview()}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cover">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cover Letter Editor */}
                  <div className="space-y-6">
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
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Cover Letter Text:
                          </label>
                          <Textarea
                            value={coverText}
                            onChange={(e) => handleTextChange('cover', e.target.value, setCoverText, 'cover')}
                            placeholder="Enter your cover letter here... (e.g., Dear **Hiring Manager**, ...)"
                            className="min-h-[400px] resize-y border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cover Letter Feedback and Preview */}
                  <div className="space-y-6">
                    <FeedbackPanel
                      fieldId="cover"
                      onApply={(content) => applyContent('cover', content)}
                    />
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Cover Letter Preview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{replacePlaceholders(coverText)}</ReactMarkdown></div>
                      </CardContent>
                    </Card>
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
"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import Image from 'next/image'

export default function PayslipGenerator() {
  const [month, setMonth] = useState("")
  const [year, setYear] = useState("")
  const [monthlySalary, setMonthlySalary] = useState(250000)
  const [basicSalary, setBasicSalary] = useState(227275)
  const [taxPaidFiscalYear, setTaxPaidFiscalYear] = useState("0")
  const [companyTitle, setCompanyTitle] = useState("")
  const [companySubtitle, setCompanySubtitle] = useState("LIMITED")
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)

  const [earnings, setEarnings] = useState<{ name: string; amount: number }[]>([])
  const [deductions, setDeductions] = useState<{ name: string; amount: number }[]>([])

  const [newEarningName, setNewEarningName] = useState("")
  const [newEarningAmount, setNewEarningAmount] = useState("")
  const [newDeductionName, setNewDeductionName] = useState("")
  const [newDeductionAmount, setNewDeductionAmount] = useState("")

  const [totalEarning, setTotalEarning] = useState(0)
  const [totalDeduction, setTotalDeduction] = useState(0)
  const [netPayment, setNetPayment] = useState(0)

  // Update the initial state to empty values
  const [employeeInfo, setEmployeeInfo] = useState({
    code: "",
    name: "",
    designation: "",
    department: "",
    subDepartment: "",
    cnicNo: "",
    joiningDate: "",
    monthlySalary: "",
    employeeStatus: "",
    station: ""
  })

  // Leave balances state
  const [leaveBalances, setLeaveBalances] = useState({
    annualLeave: "8.00",
    selfWedding: "10.00",
    paternity: "5.00",
    unpaid: "100.00",
    sickLeave: "0.00",
    bereavement: "5.00"
  })

  // Function to split company title
  const getCompanyTitleLines = (title: string) => {
    const smcIndex = title.indexOf("(SMC-PRIVATE)")
    if (smcIndex !== -1) {
      const firstLine = title.substring(0, smcIndex + 13).trim()
      const secondLine = title.substring(smcIndex + 13).trim()
      return [firstLine, secondLine]
    }
    return [title, ""]
  }

  // Add logo upload handler
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCompanyLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    // Calculate totals whenever earnings or deductions change
    const earningTotal = earnings.reduce((sum, item) => sum + item.amount, 0)
    const deductionTotal = deductions.reduce((sum, item) => sum + item.amount, 0)

    setTotalEarning(earningTotal)
    setTotalDeduction(deductionTotal)
    setNetPayment(earningTotal - deductionTotal)
  }, [earnings, deductions])

  useEffect(() => {
    // Update basic salary when monthly salary changes
    setBasicSalary(Math.round(monthlySalary * 0.9091)) // Approximating the ratio from the example
  }, [monthlySalary])

  const addEarning = () => {
    if (newEarningName && newEarningAmount) {
      setEarnings([
        ...earnings,
        {
          name: newEarningName,
          amount: Number.parseFloat(newEarningAmount),
        },
      ])
      setNewEarningName("")
      setNewEarningAmount("")
    }
  }

  const addDeduction = () => {
    if (newDeductionName && newDeductionAmount) {
      setDeductions([
        ...deductions,
        {
          name: newDeductionName,
          amount: Number.parseFloat(newDeductionAmount),
        },
      ])
      setNewDeductionName("")
      setNewDeductionAmount("")
    }
  }

  const numberToWords = (num: number): string => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    if (num === 0) return 'zero';

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };

    const convert = (n: number): string => {
      if (n < 1000) return convertLessThanThousand(n);
      if (n < 1000000) return convertLessThanThousand(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convertLessThanThousand(n % 1000) : '');
      if (n < 1000000000) return convertLessThanThousand(Math.floor(n / 1000000)) + ' million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
      return convertLessThanThousand(Math.floor(n / 1000000000)) + ' billion' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    };

    return convert(num) + ' only';
  };

  const generatePDF = () => {
    const doc = new jsPDF()
    const pageHeight = doc.internal.pageSize.height

    // Set font
    doc.setFont("helvetica")

    // Add company logo to the right if exists
    if (companyLogo) {
      const maxWidth = 35
      const maxHeight = 25
      
      doc.addImage(companyLogo, "PNG", 160, 10, maxWidth, maxHeight)
    }

    // Company title - LEFT ALIGNED with specific RGB color
    doc.setFontSize(14)
    doc.setTextColor(51, 117, 200) // Updated title color to #3375C8
    const [titleLine1, titleLine2] = getCompanyTitleLines(companyTitle)
    doc.text(titleLine1, 5, 15, { maxWidth: 100 })
    doc.text(titleLine2, 5, 21, { maxWidth: 100 })
    doc.text("--", 5, 27)
    doc.setFontSize(11)
    doc.text(`Payslip for the month of ${month} ${year}`, 5, 31)

    // Employee info box - Adjusted position and size with dynamic height
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.1)
    doc.rect(5, 38, 190, 25) // Increased height to accommodate wrapped text

    doc.setFontSize(7)
    doc.setTextColor(0)

    // Function to write text with mixed styles - updated with improved word wrapping
    const writeTextWithBoldValue = (label: string, value: string, x: number, y: number, maxWidth?: number) => {
      const colonIndex = label.lastIndexOf(":")
      const baseLabel = label.substring(0, colonIndex)
      doc.setFont("helvetica", "normal")
      doc.text(baseLabel, x, y)
      doc.text(": ", x + doc.getTextWidth(baseLabel), y)
      doc.setFont("helvetica", "bold")
      
      if (maxWidth) {
        const startX = x + doc.getTextWidth(baseLabel + ": ")
        const textLines = doc.splitTextToSize(value, maxWidth)
        textLines.forEach((line: string, index: number) => {
          doc.text(line, startX, y + (index * 4))
        })
        return textLines.length // Return number of lines for height calculation
      } else {
        doc.text(value, x + doc.getTextWidth(baseLabel + ": "), y)
        return 1
      }
    }

    // Left column
    writeTextWithBoldValue("Employee Code :", employeeInfo.code, 7, 43)
    writeTextWithBoldValue("Department :", employeeInfo.department, 7, 47)
    writeTextWithBoldValue("CNIC No :", employeeInfo.cnicNo, 7, 51)
    writeTextWithBoldValue("Employee Status :", employeeInfo.employeeStatus, 7, 55)

    // Middle column
    writeTextWithBoldValue("Employee Name :", employeeInfo.name, 85, 43)
    writeTextWithBoldValue("Sub Department :", employeeInfo.subDepartment, 85, 47)
    writeTextWithBoldValue("Joining Date :", employeeInfo.joiningDate, 85, 51)

    // Right column - with maxWidth for all fields
    writeTextWithBoldValue("Station :", employeeInfo.station, 155, 43, 40)
    const designationLines = writeTextWithBoldValue("Designation :", employeeInfo.designation, 155, 47, 40)
    writeTextWithBoldValue("Monthly Salary :", employeeInfo.monthlySalary, 155, 47 + (designationLines * 4), 40)

    // Main content box - Adjusted to have 8px gap
    doc.setDrawColor(200, 200, 200)
    doc.rect(5, 63, 190, 100) // Moved from y=60 to y=63 for 8px gap

    // Headers - Adjusted height to be slimmer
    doc.setDrawColor(200, 200, 200)
    
    // Draw the bottom line of headers
    doc.line(5, 70, 195, 70) // Moved from y=67 to y=70
    
    // Draw the top line of headers
    doc.line(5, 63, 195, 63) // Moved from y=60 to y=63

    // Add vertical divider lines AFTER the header section
    doc.line(73, 70, 73, 163) // Adjusted to new height
    doc.line(131, 70, 131, 163) // Adjusted to new height

    // Headers text - Centered with adjusted y-coordinate and bold font
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Earning", 36.5, 68, { align: "center" })
    doc.text("Deduction", 99.5, 68, { align: "center" })
    doc.text("Total Years To Date", 160.5, 68, { align: "center" })

    // Reset to 7px for remaining content
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")

    // Dynamic Earnings
    let earningY = 74
    earnings.forEach((earning) => {
      doc.text(earning.name, 8, earningY)
      doc.text(earning.amount.toLocaleString(), 70, earningY, { align: "right" })
      earningY += 5
    })

    // Dynamic Deductions
    let deductionY = 74
    deductions.forEach((deduction) => {
      doc.text(deduction.name, 75, deductionY)
      doc.text(deduction.amount.toLocaleString(), 128, deductionY, { align: "right" })
      deductionY += 5
    })

    // Tax paid text with margins
    doc.text("Tax paid in this fiscal year", 133, 74)
    doc.text(Number(taxPaidFiscalYear).toLocaleString(), 190, 74, { align: "right" })

    // Update Total Earning in the total box
    doc.setFont("helvetica", "bold")
    doc.text("Total Earning", 8, 165.5)
    doc.text(totalEarning.toLocaleString(), 70, 165.5, { align: "right" })

    // Update Total Deduction in the total box
    doc.text("Total Deduction", 75, 165.5)
    doc.text(totalDeduction.toLocaleString(), 128, 165.5, { align: "right" })

    doc.text("-", 133, 165.5)
    doc.text("-", 190, 165.5, { align: "right" })
    doc.setFont("helvetica", "normal")

    // Leave Balances box - Full width and extra slim
    doc.rect(131, 76, 64, 4)
    doc.setFont("helvetica", "bold")
    doc.text("Leave Balances", 163, 79, { align: "center" })
    doc.setFont("helvetica", "normal")

    // Leave details - aligned with Tax and 16,688
    let leaveYPos = 84 // Starting position for leave details
    const leaveData = [
      { name: "Annual Leave", value: leaveBalances.annualLeave },
      { name: "Self-Wedding", value: leaveBalances.selfWedding },
      { name: "Paternity", value: leaveBalances.paternity },
      { name: "Unpaid", value: leaveBalances.unpaid },
      { name: "Sick Leave", value: leaveBalances.sickLeave },
      { name: "Bereavement", value: leaveBalances.bereavement }
    ]

    leaveData.forEach((leave) => {
      doc.text(leave.name, 133, leaveYPos)
      doc.text(leave.value, 190, leaveYPos, { align: "right" })
      leaveYPos += 5
    })

    // Totals row - aligned with columns above
    doc.line(5, 163, 195, 163)

    // Total boxes with white background - aligned with columns and extra slim
    doc.setDrawColor(200, 200, 200)
    doc.rect(5, 163, 68, 4) // First column - Earning
    doc.rect(73, 163, 58, 4) // Second column - Deduction
    doc.rect(131, 163, 64, 4) // Third column - Total Years To Date

    // Total texts aligned with their respective columns - bold and perfectly centered
    doc.setFont("helvetica", "bold")
    doc.text("Total Deduction", 75, 165.5)
    //doc.text("20,592", 128, 165.5, { align: "right" })

    doc.text("-", 133, 165.5)
    doc.text("-", 190, 165.5, { align: "right" })
    doc.setFont("helvetica", "normal")

    // Net payment box - slimmer height
    doc.rect(5, 171, 190, 12)

    // Using writeTextWithBoldValue for consistent formatting
    writeTextWithBoldValue("Net Payment:", `PKR ${netPayment.toLocaleString()}/-`, 8, 175)
    writeTextWithBoldValue("Amount In Words:", `${numberToWords(netPayment)}.`, 8, 179)

    // Footer - NOT BOLD with 8px gap
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text("This is an automatically generated payslip and does not require any signature.", 105, 191, {
      align: "center",
    })

    // Add horizontal line above bottom text
    doc.line(15, pageHeight - 20, 190, pageHeight - 20)

    // Bottom text with Payslip and date on separate lines, and page number on right
    doc.setTextColor(102, 102, 102) // Set medium-light gray color (#666666)
    doc.text("Payslip", 15, pageHeight - 15)
    const date = new Date()
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()} ${date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    doc.text(formattedDate, 15, pageHeight - 10)
    doc.text("Page 1 of 1", 190, pageHeight - 10, { align: "right" })
    doc.setTextColor(0) // Reset text color to black for next use

    doc.save(`payslip-${month}-${year}.pdf`)
  }

  const handleEmployeeInfoChange = (field: string, value: string) => {
    setEmployeeInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLeaveBalanceChange = (type: string, value: string) => {
    setLeaveBalances(prev => ({
      ...prev,
      [type]: value
    }))
  }

  return (
    <div className="flex justify-center min-h-screen w-full">
      <div className="flex gap-8 p-8">
        {/* Payslip Preview */}
        <div className="w-[595px] min-h-[842px] bg-white relative shadow-md p-8" style={{ fontFamily: 'Helvetica' }}>
          {/* Header Section */}
          <div style={{ marginBottom: '25px' }}>
            <div className="relative">
              <div style={{ maxWidth: '300px' }}>
                <h1 style={{ fontSize: '14px', color: "#3375C8", marginBottom: '0', wordBreak: 'break-word' }}>
                  {getCompanyTitleLines(companyTitle)[0]}
                </h1>
                <h2 style={{ fontSize: '14px', color: "#3375C8", marginBottom: '0', wordBreak: 'break-word' }}>
                  {getCompanyTitleLines(companyTitle)[1]}
                </h2>
                <p style={{ fontSize: '14px', color: "#3375C8", margin: '0' }}>--</p>
                <p style={{ fontSize: '11px', color: "#3375C8", marginTop: '4px' }}>
                  Payslip for the month of {month} {year}
                </p>
              </div>
              <div style={{ position: 'absolute', top: '0', right: '0' }}>
                {companyLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    width={35}
                    height={35}
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Employee Info Box */}
          <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>Employee Code : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.code}</span>
                </div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>Department : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.department}</span>
                </div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>CNIC No : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.cnicNo}</span>
                </div>
                <div style={{ fontSize: '10px' }}>
                  <span>Employee Status : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.employeeStatus}</span>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>Employee Name : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.name}</span>
                </div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>Sub Department : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.subDepartment}</span>
                </div>
                <div style={{ fontSize: '10px' }}>
                  <span>Joining Date : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.joiningDate}</span>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                  <span>Station : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.station}</span>
                </div>
                <div style={{ marginBottom: '5px', fontSize: '10px', maxWidth: '100%' }}>
                  <span>Designation : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word', display: 'inline-block' }}>{employeeInfo.designation}</span>
                </div>
                <div style={{ fontSize: '10px' }}>
                  <span>Monthly Salary : </span>
                  <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{employeeInfo.monthlySalary}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Box */}
          <div style={{ border: '1px solid #ddd' }}>
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #ddd' }}>
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>Earning</div>
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>Deduction</div>
              <div style={{ textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 'bold' }}>Total Years To Date</div>
            </div>

            {/* Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', minHeight: '400px' }}>
              {/* Earnings Column */}
              <div style={{ borderRight: '1px solid #ddd', padding: '10px' }}>
                {/* Display existing earnings */}
                {earnings.map((earning, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                    <span>{earning.name}</span>
                    <span>{earning.amount.toLocaleString()}</span>
                  </div>
                ))}

                {/* Add new earning form */}
                <div className="mt-2">
                  <div className="flex flex-col gap-1">
                    <Input
                      placeholder="Name"
                      value={newEarningName}
                      onChange={(e) => setNewEarningName(e.target.value)}
                      className="h-6 text-xs min-h-0 px-2"
                    />
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newEarningAmount}
                        onChange={(e) => setNewEarningAmount(e.target.value)}
                        className="h-6 text-xs min-h-0 px-2"
                      />
                      <Button 
                        onClick={addEarning}
                        className="h-6 text-xs px-2 py-0 bg-blue-600 hover:bg-blue-700 text-white"
                        type="button"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div style={{ borderRight: '1px solid #ddd', padding: '10px' }}>
                {/* Display existing deductions */}
                {deductions.map((deduction, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                    <span>{deduction.name}</span>
                    <span>{deduction.amount.toLocaleString()}</span>
                  </div>
                ))}

                {/* Add new deduction form */}
                <div className="mt-2">
                  <div className="flex flex-col gap-1">
                    <Input
                      placeholder="Name"
                      value={newDeductionName}
                      onChange={(e) => setNewDeductionName(e.target.value)}
                      className="h-6 text-xs min-h-0 px-2"
                    />
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={newDeductionAmount}
                        onChange={(e) => setNewDeductionAmount(e.target.value)}
                        className="h-6 text-xs min-h-0 px-2"
                      />
                      <Button 
                        onClick={addDeduction}
                        className="h-6 text-xs px-2 py-0 bg-blue-600 hover:bg-blue-700 text-white"
                        type="button"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Years Column */}
              <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                  <span>Tax paid in this fiscal year</span>
                  <span>{Number(taxPaidFiscalYear).toLocaleString()}</span>
                </div>

                {/* Leave Balances Box */}
                <div style={{ border: '1px solid #ddd', marginTop: '8px' }}>
                  <div style={{ padding: '5px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    Leave Balances
                  </div>
                  <div style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' }}>
                      <span>Annual Leave</span>
                      <span>{leaveBalances.annualLeave}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' }}>
                      <span>Self-Wedding</span>
                      <span>{leaveBalances.selfWedding}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' }}>
                      <span>Paternity</span>
                      <span>{leaveBalances.paternity}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' }}>
                      <span>Unpaid</span>
                      <span>{leaveBalances.unpaid}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '10px' }}>
                      <span>Sick Leave</span>
                      <span>{leaveBalances.sickLeave}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span>Bereavement</span>
                      <span>{leaveBalances.bereavement}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #ddd' }}>
              <div style={{ padding: '8px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                  <span>Total Earning</span>
                  <span>{totalEarning.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ padding: '8px', background: 'white', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                  <span>Total Deduction</span>
                  <span>{totalDeduction.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ padding: '8px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                  <span>-</span>
                  <span>-</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Payment Box */}
          <div style={{ border: '1px solid #ddd', padding: '15px', margin: '15px 0' }}>
            <div style={{ marginBottom: '8px', fontSize: '10px' }}>
              <span>Net Payment: </span>
              <span style={{ fontWeight: 'bold' }}>PKR {netPayment.toLocaleString()}/-</span>
            </div>
            <div style={{ fontSize: '10px' }}>
              <span>Amount In Words: </span>
              <span style={{ fontWeight: 'bold' }}>{numberToWords(netPayment)}.</span>
            </div>
          </div>

          {/* Signature Text */}
          <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '30px' }}>
            This is an automatically generated payslip and does not require any signature.
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', borderTop: '1px solid #ddd' }}>
            <div style={{ margin: '0 auto', padding: '15px', maxWidth: '595px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <p style={{ margin: 0 }}>Payslip</p>
                  <p style={{ margin: 0 }}>
                    {`${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getDate().toString().padStart(2, '0')}/${new Date().getFullYear()} ${new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  </p>
                </div>
                <p style={{ margin: 0 }}>Page 1 of 1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Information Form */}
        <div className="w-[800px] sticky top-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            
            {/* Company Title and Logo Fields */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
              <div>
                <Label htmlFor="companyTitle">Company Title</Label>
                <Input
                  id="companyTitle"
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                  className="mt-1"
                  placeholder="Enter company name (e.g. FUTURENOSTICS (SMC-PRIVATE) LIMITED)"
                />
              </div>
              
              <div>
                <Label htmlFor="companyLogo">Company Logo</Label>
                <Input
                  id="companyLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-1"
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Employee Information</h2>
            
            {/* Month and Year Fields */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
              <div>
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. January"
                />
              </div>
              
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. 2025"
                />
              </div>

              <div>
                <Label htmlFor="taxPaidFiscalYear">Tax Paid in Fiscal Year</Label>
                <Input
                  id="taxPaidFiscalYear"
                  value={taxPaidFiscalYear}
                  onChange={(e) => setTaxPaidFiscalYear(e.target.value)}
                  className="mt-1"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  value={employeeInfo.code}
                  onChange={(e) => handleEmployeeInfoChange('code', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={employeeInfo.name}
                  onChange={(e) => handleEmployeeInfoChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={employeeInfo.designation}
                  onChange={(e) => handleEmployeeInfoChange('designation', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={employeeInfo.department}
                  onChange={(e) => handleEmployeeInfoChange('department', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cnicNo">CNIC No</Label>
                <Input
                  id="cnicNo"
                  value={employeeInfo.cnicNo}
                  onChange={(e) => handleEmployeeInfoChange('cnicNo', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  value={employeeInfo.joiningDate}
                  onChange={(e) => handleEmployeeInfoChange('joiningDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="monthlySalary">Monthly Salary</Label>
                <Input
                  id="monthlySalary"
                  value={employeeInfo.monthlySalary}
                  onChange={(e) => handleEmployeeInfoChange('monthlySalary', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="employeeStatus">Employee Status</Label>
                <Input
                  id="employeeStatus"
                  value={employeeInfo.employeeStatus}
                  onChange={(e) => handleEmployeeInfoChange('employeeStatus', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="station">Station</Label>
                <Input
                  id="station"
                  value={employeeInfo.station}
                  onChange={(e) => handleEmployeeInfoChange('station', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subDepartment">Sub Department</Label>
                <Input
                  id="subDepartment"
                  value={employeeInfo.subDepartment}
                  onChange={(e) => handleEmployeeInfoChange('subDepartment', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Leave Balances Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Leave Balances</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualLeave">Annual Leave</Label>
                  <Input
                    id="annualLeave"
                    value={leaveBalances.annualLeave}
                    onChange={(e) => handleLeaveBalanceChange('annualLeave', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
                <div>
                  <Label htmlFor="selfWedding">Self-Wedding</Label>
                  <Input
                    id="selfWedding"
                    value={leaveBalances.selfWedding}
                    onChange={(e) => handleLeaveBalanceChange('selfWedding', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
                <div>
                  <Label htmlFor="paternity">Paternity</Label>
                  <Input
                    id="paternity"
                    value={leaveBalances.paternity}
                    onChange={(e) => handleLeaveBalanceChange('paternity', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
                <div>
                  <Label htmlFor="unpaid">Unpaid</Label>
                  <Input
                    id="unpaid"
                    value={leaveBalances.unpaid}
                    onChange={(e) => handleLeaveBalanceChange('unpaid', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
                <div>
                  <Label htmlFor="sickLeave">Sick Leave</Label>
                  <Input
                    id="sickLeave"
                    value={leaveBalances.sickLeave}
                    onChange={(e) => handleLeaveBalanceChange('sickLeave', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
                <div>
                  <Label htmlFor="bereavement">Bereavement</Label>
                  <Input
                    id="bereavement"
                    value={leaveBalances.bereavement}
                    onChange={(e) => handleLeaveBalanceChange('bereavement', e.target.value)}
                    className="mt-1"
                    placeholder="Enter days"
                  />
                </div>
              </div>
            </div>

            {/* Add Generate PDF Button at the bottom of the form */}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={generatePDF} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
              >
                Generate PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

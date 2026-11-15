package expo.modules.pdftext

import android.content.Context
import android.net.Uri
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.pdmodel.PDPage
import com.tom_roush.pdfbox.text.PDFTextStripper
import com.tom_roush.pdfbox.text.TextPosition
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import kotlin.math.abs
import kotlin.math.max

/**
 * extractTextItems(uri) -> { pages: [{ width, height, items: [{ text, x, y }] }] }
 *
 * x / y are the PDF user-space origin of the first glyph of a text run (y grows UP from the
 * page bottom), the same numbers pdf.js reports in item.transform[4] / [5]. Runs are words of
 * the same baseline joined while the gap between them is smaller than a space.
 */
class PdfTextModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("PdfText")

    AsyncFunction("extractTextItems") { uri: String ->
      PDFBoxResourceLoader.init(context)
      openStream(uri).use { stream ->
        val document = try {
          PDDocument.load(stream)
        } catch (e: Exception) {
          throw CodedException("ERR_PDF_READ", "Cannot open PDF", e)
        }
        document.use { doc ->
          try {
            val stripper = RunStripper()
            stripper.getText(doc)
            mapOf("pages" to stripper.pages)
          } catch (e: Exception) {
            throw CodedException("ERR_PDF_READ", "Cannot read PDF text", e)
          }
        }
      }
    }
  }

  private fun openStream(uri: String): InputStream {
    val parsed = Uri.parse(uri)
    return when (parsed.scheme) {
      "content" -> context.contentResolver.openInputStream(parsed)
        ?: throw CodedException("ERR_PDF_READ", "Cannot open $uri", null)
      "file" -> FileInputStream(File(parsed.path ?: throw CodedException("ERR_PDF_READ", "Bad file uri", null)))
      null, "" -> FileInputStream(File(uri))
      else -> throw CodedException("ERR_PDF_READ", "Unsupported uri scheme: ${parsed.scheme}", null)
    }
  }
}

private class Word(
  var text: String,
  val x: Double,
  val y: Double,
  var endX: Double,
  val height: Double,
)

/** Collects words in content-stream order (like pdf.js) and joins neighbours into runs. */
private class RunStripper : PDFTextStripper() {
  val pages = ArrayList<Map<String, Any>>()
  private var items = ArrayList<Map<String, Any>>()
  private var current: Word? = null

  init {
    sortByPosition = false
  }

  override fun startPage(page: PDPage) {
    items = ArrayList()
    current = null
    super.startPage(page)
  }

  override fun endPage(page: PDPage) {
    flush()
    val box = page.cropBox ?: page.mediaBox
    pages.add(
      mapOf(
        "width" to box.width.toDouble(),
        "height" to box.height.toDouble(),
        "items" to items,
      ),
    )
    super.endPage(page)
  }

  override fun writeString(text: String, textPositions: MutableList<TextPosition>) {
    if (textPositions.isEmpty() || text.isBlank()) {
      return
    }
    val first = textPositions.first()
    val last = textPositions.last()
    val x = first.textMatrix.translateX.toDouble()
    val y = first.textMatrix.translateY.toDouble()
    val endX = last.textMatrix.translateX.toDouble() + last.widthDirAdj.toDouble()
    val height = max(first.heightDir.toDouble(), 1.0)

    val prev = current
    if (prev != null && abs(prev.y - y) < 1.0 && x - prev.endX < height * 0.8 && x >= prev.x) {
      prev.text = prev.text + " " + text.trim()
      prev.endX = endX
    } else {
      flush()
      current = Word(text.trim(), x, y, endX, height)
    }
  }

  private fun flush() {
    val word = current ?: return
    items.add(mapOf("text" to word.text, "x" to word.x, "y" to word.y))
    current = null
  }
}
